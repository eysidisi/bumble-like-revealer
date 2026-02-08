---
trigger: always_on
---

### 1. Separation of Concerns Is Non-Negotiable

* **Never mix UI logic with interception logic.**
* Page-injected code and content scripts must be **plain JavaScript only**.
* UI (side panel) must be **vanilla HTML/CSS/JS** (no React, no framework, no bundler assumptions).

### 2. Keep Page-Injected Code Minimal and Passive

* Injected scripts may only:

  * patch `fetch` / `XMLHttpRequest`
  * read responses
  * parse relevant data
* Injected scripts must **never**:

  * modify requests
  * mutate server responses
  * render UI
  * write to `chrome.storage` directly
  * depend on the Bumble DOM

> Rule of thumb: injected code should be short, boring, and easy to remove.

### 3. One-Way Data Flow Only

* Data must flow strictly in this direction:

  ```
  Page → Content Script → Background (Service Worker) → Storage → UI
  ```
* Never attempt direct communication between:

  * page ↔ side panel
  * page ↔ options
* Use:

  * `window.postMessage` (page → content)
  * `chrome.runtime.sendMessage` (content → background)
  * `chrome.storage.local` (background ↔ UI)

### 4. Background Owns the Data

* The background/service worker is the **single source of truth**.
* Only background code:

  * writes to `chrome.storage.local`
  * deduplicates encounters
  * tracks timestamps (“new since last open”)
* Side panel/options code should be **read-only** and only request/subscribe to data.

### 5. UI Rules (Vanilla)

* UI must be:

  * simple DOM rendering (create elements or use minimal templating)
  * resilient to missing data
  * explicit about states: empty / loading / error
* UI must **never**:

  * patch network calls
  * access page globals
  * scrape Bumble DOM
  * rely on long-running logic (popup can close anytime)

### 6. Defensive Parsing Always

* Assume API responses can:

  * change shape
  * omit fields
  * return unexpected values
* Parsing logic must:

  * validate required fields
  * use optional chaining / safe access
  * fail gracefully (log, don’t crash)

### 7. Zero Global Pollution

* Never attach app state to `window` or other globals.
* Use modules/closures and message passing only.

### 8. No Hidden Side Effects

* Logging is allowed only during development; production logging should be minimal.
* No background polling, timers, or heavy listeners unless explicitly necessary.
* Avoid any noticeable page performance hit.

### 9. Manifest & MV3 Compliance First

* Assume strict CSP:

  * **no inline scripts**
  * **no eval**
* Background code must be service-worker safe:

  * no DOM APIs
  * no reliance on in-memory state persisting

### 10. Permissions: Minimum Necessary

* Never request new permissions unless essential.
* Prefer narrow host permissions and scoped listeners.

### 11. Optimize for Deletability

* Every module should be independently understandable and replaceable.
* Prefer clear, explicit code over clever abstractions.

