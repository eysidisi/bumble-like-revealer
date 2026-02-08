(function initContentBridge() {
    const contracts = window.BLR_CONTRACTS;
    if (!contracts) return;

    const { CHANNEL, MESSAGE_TYPES } = contracts;

    function injectScript(src) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    }

    function injectBootstrap() {
        injectScript('src/injected/bootstrap.js');
    }

    function setupPageToExtensionBridge() {
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            if (!contracts.isPageEncounterEvent(event.data)) return;

            chrome.runtime.sendMessage({
                channel: CHANNEL,
                type: MESSAGE_TYPES.CONTENT_NEW_ENCOUNTERS,
                payload: { encounters: event.data.payload.encounters }
            });
        });
    }

    function setupExtensionToPageBridge() {
        chrome.runtime.onMessage.addListener((message) => {
            if (!contracts.isBackgroundCommand(message)) return;

            window.postMessage({
                channel: CHANNEL,
                type: MESSAGE_TYPES.CONTENT_TO_PAGE_COMMAND,
                payload: message.payload
            }, '*');
        });
    }

    function announceContentReady() {
        chrome.runtime.sendMessage({
            channel: CHANNEL,
            type: MESSAGE_TYPES.CONTENT_READY,
            payload: { url: window.location.href }
        });
    }

    injectBootstrap();
    setupPageToExtensionBridge();
    setupExtensionToPageBridge();
    announceContentReady();
}());
