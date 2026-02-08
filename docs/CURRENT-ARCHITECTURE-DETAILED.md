# Current Architecture (Detailed)

This document describes the current runtime architecture of the extension as implemented in the repository today.

## 1. Extension Boundaries

### 1.1 Manifest wiring
- `manifest.json:20` registers background service worker: `src/background/background.js`.
- `manifest.json:23` registers content scripts on Bumble app URLs:
  - `src/shared/contracts.js`
  - `src/content/content.js`
- `manifest.json:33` runs content scripts at `document_start`.
- `manifest.json:36` exposes one web-accessible resource:
  - `src/injected/bootstrap.js`

### 1.2 Runtime contexts
1. **Background service worker**
   - File: `src/background/background.js`
   - Owns storage writes and command routing.
2. **Content script (isolated world)**
   - File: `src/content/content.js`
   - Pure bridge between page world and extension runtime.
3. **Page world (main world)**
   - File: `src/injected/bootstrap.js` (injected by content script)
   - Handles network interception and Bumble API commands.
4. **Sidepanel page**
   - Files: `sidepanel/sidepanel.html`, `sidepanel/scripts/*.js`
   - Renders storage data and sends user command intents.
5. **Shared contract layer**
   - File: `src/shared/contracts.js`
   - Defines message types, command types, vote codes, and validators.

## 2. Layer Responsibilities

### 2.1 Shared contracts
- `src/shared/contracts.js:4` defines message types.
- `src/shared/contracts.js:14` defines command names.
- `src/shared/contracts.js:20` defines vote codes.
- `src/shared/contracts.js:63` onward defines message guards:
  - `isPageEncounterEvent`
  - `isContentEncounterMessage`
  - `isContentReadyMessage`
  - `isBackgroundCommand`
  - `isSidepanelCommandMessage`

This is the schema boundary for cross-context communication.

### 2.2 Content bridge
- `src/content/content.js:14` injects page bootstrap script.
- `src/content/content.js:18` listens for page events and forwards encounter payloads to background.
- `src/content/content.js:31` listens for background commands and relays them to page via `window.postMessage`.
- `src/content/content.js:43` announces content readiness (`CONTENT_READY`) to background.

It does not own business state and does not write `chrome.storage`.

### 2.3 Page adapter (bootstrap)
- `src/injected/bootstrap.js:80` patches `fetch`.
- `src/injected/bootstrap.js:104` patches `XMLHttpRequest`.
- `src/injected/bootstrap.js:72` parses encounter payloads and normalizes encounter DTOs.
- `src/injected/bootstrap.js:64` emits page encounter events.
- `src/injected/bootstrap.js:393` receives typed commands (`send_vote`, `get_user`, `get_user_list`).
- `src/injected/bootstrap.js:317` sends Bumble API requests with computed `x-pingback`.

This context is where Bumble network protocol details currently live.

### 2.4 Background orchestrator
- `src/background/background.js:24` merges and deduplicates encounters.
- `src/background/background.js:37` writes `encounters` to `chrome.storage.local`.
- `src/background/background.js:38` emits refresh event to sidepanel.
- `src/background/background.js:46` resolves target Bumble tab id (active, remembered, fallback).
- `src/background/background.js:75` routes sidepanel commands to content script using `chrome.tabs.sendMessage`.
- `src/background/background.js:103` central message entrypoint:
  - content ready
  - content encounters
  - sidepanel command

### 2.5 Sidepanel
- `sidepanel/scripts/sidepanel-constants.js:1` imports contract constants and vote normalization helpers.
- `sidepanel/scripts/sidepanel-data.js:1` reads/sorts encounters from storage.
- `sidepanel/scripts/sidepanel-events.js:42` sends swipe commands via typed sidepanel command message.
- `sidepanel/scripts/sidepanel.js:23` refreshes UI when background sends `REFRESH_ENCOUNTERS`.

## 3. Dependency Direction

```text
Sidepanel
  -> Background (SIDEPANEL_COMMAND)
Background
  -> Content script in target Bumble tab (BACKGROUND_TO_CONTENT_COMMAND)
Content script
  -> Page world (CONTENT_TO_PAGE_COMMAND via window.postMessage)
Page world
  -> Bumble API (XHR/fetch)

Page world
  -> Content script (PAGE_NEW_ENCOUNTERS)
Content script
  -> Background (CONTENT_NEW_ENCOUNTERS)
Background
  -> Storage + REFRESH_ENCOUNTERS
Sidepanel
  -> Render from storage
```

No layer below background writes storage in this design.

## 4. Message Contract Examples

### 4.1 Page -> content: encounter event
```json
{
  "channel": "blr",
  "type": "blr/page/new-encounters",
  "payload": {
    "encounters": [
      {
        "user_id": "123",
        "name": "Alice",
        "vote_code": 2,
        "vote_status": "Already swiped right on you."
      }
    ]
  }
}
```

### 4.2 Content -> background: normalized encounter forwarding
```json
{
  "channel": "blr",
  "type": "blr/content/new-encounters",
  "payload": {
    "encounters": [
      {
        "user_id": "123",
        "name": "Alice",
        "vote_code": 2
      }
    ]
  }
}
```

### 4.3 Sidepanel -> background: swipe right command
```json
{
  "channel": "blr",
  "type": "blr/sidepanel/command",
  "payload": {
    "command": "send_vote",
    "person_id": "123",
    "vote": 2
  }
}
```

### 4.4 Background -> content: command routing
```json
{
  "channel": "blr",
  "type": "blr/background/command",
  "payload": {
    "command": "send_vote",
    "person_id": "123",
    "vote": 2
  }
}
```

## 5. Flow Examples

### 5.1 Flow A: Initial bootstrap on Bumble app page
1. Chrome loads content scripts (`contracts.js`, `content.js`) at `document_start`.
2. `content.js` injects `src/injected/bootstrap.js` into page world.
3. `content.js` sends `CONTENT_READY` to background with page URL.
4. Background stores tab id/window mapping for future command routing.

### 5.2 Flow B: Encounter capture and UI refresh
1. Bumble page performs encounter request (`SERVER_GET_ENCOUNTERS`).
2. Page bootstrap intercepts response (fetch or XHR patch).
3. Bootstrap parses results and emits `PAGE_NEW_ENCOUNTERS`.
4. Content script validates event shape and forwards `CONTENT_NEW_ENCOUNTERS` to background.
5. Background deduplicates by `user_id`, adds metadata (`timestamp`, `isNew`), writes storage.
6. Background broadcasts `REFRESH_ENCOUNTERS`.
7. Sidepanel receives refresh message and rerenders from storage.

### 5.3 Flow C: Swipe action from sidepanel
1. User clicks `Swipe Right` in sidepanel.
2. Sidepanel sends `SIDEPANEL_COMMAND` with `{ command: "send_vote", person_id, vote: 2 }`.
3. Background resolves target Bumble tab (`active` -> `remembered` -> `fallback any open Bumble tab`).
4. Background sends `BACKGROUND_TO_CONTENT_COMMAND` to that tab.
5. Content script relays command to page via `window.postMessage` (`CONTENT_TO_PAGE_COMMAND`).
6. Bootstrap executes `sendVote`, builds Bumble payload, computes `x-pingback`, sends API request.

### 5.4 Flow D: Tab lifecycle tracking
1. On `tabs.onUpdated`, background updates or clears remembered Bumble tab mapping by URL.
2. On `tabs.onRemoved`, background removes the mapping.
3. Routing still works when sidepanel is open in another tab/window because background can use remembered or fallback matching.

## 6. Data Model Notes

- Encounter persistence key: `encounters` in `chrome.storage.local`.
- Deduplication key: `user_id`.
- UI sorting priority in `sidepanel/scripts/sidepanel-data.js:4`:
  - `LIKED` first
  - `HAVENT_SEEN` second
  - `DISLIKED` third
  - unknown last
- Display labels come from `VOTE_STATUS_LABELS` in contracts, not duplicated hardcoded strings in multiple layers.

## 7. Security/Isolation Notes

- Content script only forwards page messages that pass contract guard checks (`isPageEncounterEvent`).
- Background only routes commands that pass `isSidepanelCommandMessage`.
- Page and content exchange is namespaced with `channel: "blr"` and typed message names.
- Only one injected page script is web-accessible, reducing public resource surface.

## 8. Known Constraints

1. Bumble endpoint constants and payload formats are hardcoded in `src/injected/bootstrap.js`.
2. `x-pingback` generation logic is also located in page bootstrap, so command execution is page-context dependent by design.
3. Background command routing assumes at least one Bumble app tab is open.

