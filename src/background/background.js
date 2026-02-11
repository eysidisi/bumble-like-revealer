importScripts('../shared/contracts.js');

const { CHANNEL, MESSAGE_TYPES, isContentEncounterMessage, isContentReadyMessage, isSidepanelCommandMessage } = self.BLR_CONTRACTS;
const bumbleTabIdByWindowId = new Map();

function isBumbleAppUrl(url) {
    return typeof url === 'string' && /^https:\/\/([^.]+\.)?bumble\.com\/app/i.test(url);
}

function rememberBumbleTab(tab) {
    if (!tab || typeof tab.id !== 'number' || typeof tab.windowId !== 'number') return;
    if (!isBumbleAppUrl(tab.url)) return;
    bumbleTabIdByWindowId.set(tab.windowId, tab.id);
}

function forgetTab(tabId) {
    for (const [windowId, storedTabId] of bumbleTabIdByWindowId.entries()) {
        if (storedTabId === tabId) {
            bumbleTabIdByWindowId.delete(windowId);
        }
    }
}

function mergeEncounters(newEncounters) {
    chrome.storage.local.get(['encounters'], (result) => {
        const existingEncounters = Array.isArray(result.encounters) ? result.encounters : [];
        const existingIds = new Set(existingEncounters.map((encounter) => encounter.user_id));

        const uniqueNewEncounters = newEncounters.filter((encounter) => !existingIds.has(encounter.user_id));
        const encountersToAdd = uniqueNewEncounters.map((encounter) => ({
            ...encounter,
            timestamp: Date.now(),
            isNew: true
        }));

        const updatedEncounters = [...existingEncounters, ...encountersToAdd];
        chrome.storage.local.set({ encounters: updatedEncounters }, () => {
            chrome.runtime.sendMessage({
                channel: CHANNEL,
                type: MESSAGE_TYPES.REFRESH_ENCOUNTERS
            });
        });
    });
}

function resetEncounters() {
    chrome.storage.local.set({ encounters: [] }, () => {
        chrome.runtime.sendMessage({
            channel: CHANNEL,
            type: MESSAGE_TYPES.REFRESH_ENCOUNTERS
        });
    });
}

function findTargetBumbleTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs.find((tab) => isBumbleAppUrl(tab.url));
        if (activeTab) {
            rememberBumbleTab(activeTab);
            callback(activeTab.id);
            return;
        }

        const currentWindowId = tabs[0]?.windowId;
        const rememberedTabId = typeof currentWindowId === 'number' ? bumbleTabIdByWindowId.get(currentWindowId) : undefined;
        if (typeof rememberedTabId === 'number') {
            callback(rememberedTabId);
            return;
        }

        chrome.tabs.query({}, (allTabs) => {
            const fallbackTab = allTabs.find((tab) => isBumbleAppUrl(tab.url));
            if (fallbackTab) {
                rememberBumbleTab(fallbackTab);
                callback(fallbackTab.id);
                return;
            }

            callback(null);
        });
    });
}

function routeCommandToContentScript(payload) {
    findTargetBumbleTabId((tabId) => {
        if (typeof tabId !== 'number') return;

        chrome.tabs.sendMessage(tabId, {
            channel: CHANNEL,
            type: MESSAGE_TYPES.BACKGROUND_TO_CONTENT_COMMAND,
            payload
        }, () => {
            void chrome.runtime.lastError;
        });
    });
}

chrome.tabs.onRemoved.addListener((tabId) => {
    forgetTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (typeof changeInfo.url === 'string') {
        if (isBumbleAppUrl(changeInfo.url)) {
            rememberBumbleTab({ ...tab, id: tabId, url: changeInfo.url });
        } else {
            forgetTab(tabId);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (isContentReadyMessage(message)) {
        if (message?.payload?.isReload === true) {
            resetEncounters();
        }
        if (sender?.tab) rememberBumbleTab(sender.tab);
        return;
    }

    if (isContentEncounterMessage(message)) {
        const encounters = message.payload.encounters;
        mergeEncounters(encounters);
        if (sender?.tab) rememberBumbleTab(sender.tab);
        return;
    }

    if (isSidepanelCommandMessage(message)) {
        routeCommandToContentScript(message.payload);
    }
});
