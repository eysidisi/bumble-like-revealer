function injectScript(src) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
}

function setupMessageListener() {
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type === 'new_encounters') {
            chrome.runtime.sendMessage(event.data);
        }
    });
}

function resetEncounters() {
    chrome.storage.local.set({ encounters: [] });
}

// Inject scripts
injectScript('src/shared/constants.js');
injectScript('src/shared/models.js');
injectScript('src/shared/handlers.js');
injectScript('src/injected/patchFetch.js');
injectScript('src/injected/patchXMLHttpRequest.js');
injectScript('src/injected/page.js');

resetEncounters();
setupMessageListener();