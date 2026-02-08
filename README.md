# Bumble Like Revealer

## Overview
Chrome extension that intercepts Bumble encounter API responses and shows encounter details in a side panel.

## Architecture
- **Background (`src/background/background.js`)**: single storage owner and message router.
- **Content script (`src/content/content.js`)**: strict bridge between page world and extension runtime.
- **Injected page bootstrap (`src/injected/bootstrap.js`)**: encounter interception + Bumble command execution.
- **Shared contracts (`src/shared/contracts.js`)**: message types, command types, vote codes, and validators.
- **Sidepanel (`sidepanel/`)**: rendering and user actions only.

## Key Behavior
- Intercepts encounter responses from Bumble page network traffic.
- Deduplicates and stores encounters in `chrome.storage.local`.
- Renders and sorts encounters by vote code in the side panel.
- Sends swipe actions from side panel to background, then to the active Bumble tab via typed messages.

## Notes
- MV3 manifest with `document_start` content bridge and a single web-accessible injected entrypoint.
- No background `executeScript` function injection path.
- No content-script storage reset side effect.
