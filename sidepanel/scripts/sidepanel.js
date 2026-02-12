let list;

document.addEventListener('DOMContentLoaded', () => {
    list = document.getElementById('encounter-list');
    const toggleButton = document.getElementById('toggle-list');
    const expandAllBtn = document.getElementById('expand-all');
    const sendMessageUserIdInput = document.getElementById('send-message-user-id');
    const sendHiButton = document.getElementById('send-hi-btn');

    setupEvents(list, toggleButton, expandAllBtn, sendMessageUserIdInput, sendHiButton);

    renderEncounters();
});

function renderEncounters() {
    getEncounters((encounters) => {
        list.innerHTML = '';
        encounters.forEach(encounter => {
            const li = renderEncounter(encounter);
            list.appendChild(li);
        });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message?.channel === CHANNEL && message.type === MESSAGE_TYPES.REFRESH_ENCOUNTERS) {
        renderEncounters();
    }
});
