importScripts('../shared/sendVote.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'new_encounters') {
        const newEncounters = message.encounters;

        // Get existing encounters
        chrome.storage.local.get(['encounters'], (result) => {
            const existing = result.encounters || [];
            const existingIds = new Set(existing.map(enc => enc.user_id));

            // Filter new ones not already present
            const uniqueNew = newEncounters.filter(enc => !existingIds.has(enc.user_id));

            // Add with timestamp
            const toAdd = uniqueNew.map(enc => ({
                ...enc,
                timestamp: Date.now(),
                isNew: true
            }));

            // Combine and store
            const updated = [...existing, ...toAdd];
            chrome.storage.local.set({ encounters: updated });

            // Notify side panel to refresh
            chrome.runtime.sendMessage({ type: 'refresh_encounters' });
        });
    } else if (message.type === 'send_vote') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && tab.url.includes('bumble.com')) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: self.sendVote,
                    args: [message.person_id, message.vote]
                });
            }
        });
    }
});