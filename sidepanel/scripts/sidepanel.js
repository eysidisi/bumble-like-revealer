let list;
let encounterSortMode = 'name';
let sortEncountersButton;
let encountersCountLabel;

document.addEventListener('DOMContentLoaded', () => {
    list = document.getElementById('encounter-list');
    const toggleButton = document.getElementById('toggle-list');
    const expandAllBtn = document.getElementById('expand-all');
    sortEncountersButton = document.getElementById('sort-encounters');
    const likeAllButton = document.getElementById('like-all');
    const dislikeAllButton = document.getElementById('dislike-all');
    encountersCountLabel = document.getElementById('encounters-count');
    const sendMessageUserIdInput = document.getElementById('send-message-user-id');
    const sendHiButton = document.getElementById('send-hi-btn');
    const pagedLastPersonIdInput = document.getElementById('paged-last-person-id-input');
    const fetchPagedEncountersBtn = document.getElementById('fetch-paged-encounters-btn');
    const autoFetchEncountersBtn = document.getElementById('auto-fetch-encounters-btn');
    const ageMinInput = document.getElementById('age-min-input');
    const ageMaxInput = document.getElementById('age-max-input');
    const verifiedProfilesOnlyInput = document.getElementById('verified-profiles-only-input');
    const saveSearchSettingsBtn = document.getElementById('save-search-settings-btn');

    if (sortEncountersButton) {
        sortEncountersButton.addEventListener('click', () => {
            encounterSortMode = encounterSortMode === 'name' ? 'age' : 'name';
            sortEncountersButton.textContent = encounterSortMode === 'name' ? 'Sort: Name' : 'Sort: Age';
            renderEncounters();
        });
    }

    setupEvents(
        list,
        toggleButton,
        expandAllBtn,
        likeAllButton,
        dislikeAllButton,
        sendMessageUserIdInput,
        sendHiButton,
        pagedLastPersonIdInput,
        fetchPagedEncountersBtn,
        autoFetchEncountersBtn,
        ageMinInput,
        ageMaxInput,
        verifiedProfilesOnlyInput,
        saveSearchSettingsBtn
    );

    renderEncounters();
});

function renderEncounters() {
    getEncounters(encounterSortMode, (encounters) => {
        if (encountersCountLabel) {
            encountersCountLabel.textContent = `(${encounters.length})`;
        }
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
