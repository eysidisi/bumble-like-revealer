let list;

document.addEventListener('DOMContentLoaded', () => {
    list = document.getElementById('encounter-list');
    const toggleButton = document.getElementById('toggle-list');
    const expandAllBtn = document.getElementById('expand-all');

    setupEvents(list, toggleButton, expandAllBtn);

    renderEncounters();
});

function renderEncounters() {
    getEncounters((encounters) => {
        // Clear existing list
        list.innerHTML = '';
        console.log('rendering')
        encounters.forEach(encounter => {
            const li = renderEncounter(encounter);
            list.appendChild(li);
        });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'refresh_encounters') {
        renderEncounters();
    }
});
