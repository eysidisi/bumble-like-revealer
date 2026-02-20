function setupEvents(
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
) {
    let isCollapsed = false;
    let autoFetchTimeoutId = null;
    let isAutoFetchActive = false;

    function parseOptionalNumber(value) {
        const trimmed = (value || '').trim();
        if (!trimmed) return null;
        if (!/^\d+$/.test(trimmed)) return NaN;
        return Number.parseInt(trimmed, 10);
    }

    function sendPagedEncounterRequest(lastPersonId) {
        chrome.runtime.sendMessage({
            channel: CHANNEL,
            type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
            payload: {
                command: COMMANDS.GET_ENCOUNTERS_PAGED,
                last_person_id: lastPersonId || undefined
            }
        });
    }

    function clearAutoFetchTimer() {
        if (autoFetchTimeoutId !== null) {
            clearTimeout(autoFetchTimeoutId);
            autoFetchTimeoutId = null;
        }
    }

    function scheduleNextAutoFetch() {
        if (!isAutoFetchActive) return;
        const nextDelayMs = 100 + Math.floor(Math.random() * 100);
        autoFetchTimeoutId = setTimeout(() => {
            if (!isAutoFetchActive) return;
            sendPagedEncounterRequest(undefined);
            scheduleNextAutoFetch();
        }, nextDelayMs);
    }

    toggleButton.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        list.style.display = isCollapsed ? 'none' : 'block';
        toggleButton.textContent = isCollapsed ? 'Expand' : 'Collapse';
        if (isCollapsed) {
            // Collapse all details
            const detailsDivs = list.querySelectorAll('.details');
            detailsDivs.forEach(div => div.style.display = 'none');
            // Reset button texts
            const buttons = list.querySelectorAll('button');
            buttons.forEach(btn => {
                if (btn.textContent === 'Hide') btn.textContent = 'Details';
                if (btn.textContent === 'Hide Photos') btn.textContent = 'Photos';
            });
        }
    });

    expandAllBtn.addEventListener('click', () => {
        // Ensure the list is visible
        if (isCollapsed) {
            list.style.display = 'block';
            toggleButton.textContent = 'Collapse';
            isCollapsed = false;
        }
        // Expand all details
        const detailsDivs = list.querySelectorAll('.details');
        detailsDivs.forEach(div => div.style.display = 'block');
        // Expand all photos
        const photosDivs = list.querySelectorAll('.details > div');
        photosDivs.forEach(div => div.style.display = 'block');
        // Set button texts
        const buttons = list.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent === 'Details') btn.textContent = 'Hide';
            if (btn.textContent === 'Photos') btn.textContent = 'Hide Photos';
        });
    });

    if (likeAllButton) {
        likeAllButton.addEventListener('click', () => {
            if (!confirm('Swipe right on all current encounters?')) return;

            getEncounters((encounters) => {
                const personIds = encounters
                    .map((encounter) => encounter?.user_id || '')
                    .filter(Boolean);

                personIds.forEach((personId) => {
                    chrome.runtime.sendMessage({
                        channel: CHANNEL,
                        type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                        payload: {
                            command: COMMANDS.SEND_VOTE,
                            person_id: personId,
                            vote: VoteCode.LIKED
                        }
                    });
                });
            });
        });
    }

    if (dislikeAllButton) {
        dislikeAllButton.addEventListener('click', () => {
            if (!confirm('Swipe left on all current encounters?')) return;

            getEncounters((encounters) => {
                const personIds = encounters
                    .map((encounter) => encounter?.user_id || '')
                    .filter(Boolean);

                function sendNext(index) {
                    if (index >= personIds.length) return;

                    chrome.runtime.sendMessage({
                        channel: CHANNEL,
                        type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                        payload: {
                            command: COMMANDS.SEND_VOTE,
                            person_id: personIds[index],
                            vote: VoteCode.DISLIKED
                        }
                    });

                    setTimeout(() => sendNext(index + 1), 250);
                }

                sendNext(0);
            });
        });
    }

    list.addEventListener('click', (event) => {
        if (event.target.classList.contains('swipe-left-btn')) {
            if (confirm('Are you sure to swipe left?')) {
                const personId = event.target.getAttribute('data-person-id');
                chrome.runtime.sendMessage({
                    channel: CHANNEL,
                    type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                    payload: {
                        command: COMMANDS.SEND_VOTE,
                        person_id: personId,
                        vote: VoteCode.DISLIKED
                    }
                });
            }
        }
        if (event.target.classList.contains('swipe-right-btn')) {
            if (confirm('Are you sure to swipe right?')) {
                const personId = event.target.getAttribute('data-person-id');
                chrome.runtime.sendMessage({
                    channel: CHANNEL,
                    type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                    payload: {
                        command: COMMANDS.SEND_VOTE,
                        person_id: personId,
                        vote: VoteCode.LIKED
                    }
                });
            }
        }
    });

    if (sendHiButton && sendMessageUserIdInput) {
        sendHiButton.addEventListener('click', () => {
            const personId = (sendMessageUserIdInput.value || '').trim();
            if (!personId) return;

            chrome.runtime.sendMessage({
                channel: CHANNEL,
                type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                payload: {
                    command: COMMANDS.SEND_MESSAGE,
                    person_id: personId,
                    text: 'hi'
                }
            });
        });
    }

    if (fetchPagedEncountersBtn) {
        fetchPagedEncountersBtn.addEventListener('click', () => {
            const manualLastPersonId = pagedLastPersonIdInput ? (pagedLastPersonIdInput.value || '').trim() : '';
            sendPagedEncounterRequest(manualLastPersonId);
        });
    }

    if (autoFetchEncountersBtn) {
        autoFetchEncountersBtn.addEventListener('click', () => {
            if (isAutoFetchActive) {
                isAutoFetchActive = false;
                clearAutoFetchTimer();
                autoFetchEncountersBtn.textContent = 'Start Auto Fetch';
                return;
            }

            isAutoFetchActive = true;
            autoFetchEncountersBtn.textContent = 'Stop Auto Fetch';
            sendPagedEncounterRequest(undefined);
            scheduleNextAutoFetch();
        });
    }

    window.addEventListener('beforeunload', () => {
        isAutoFetchActive = false;
        clearAutoFetchTimer();
    });

    if (saveSearchSettingsBtn && ageMinInput && ageMaxInput) {
        saveSearchSettingsBtn.addEventListener('click', () => {
            const minAge = parseOptionalNumber(ageMinInput.value);
            const maxAge = parseOptionalNumber(ageMaxInput.value);
            const verifiedProfilesOnly = verifiedProfilesOnlyInput ? verifiedProfilesOnlyInput.checked === true : false;

            if (Number.isNaN(minAge) || Number.isNaN(maxAge)) {
                alert('Age values must be numeric.');
                return;
            }

            if (minAge !== null && maxAge !== null && minAge > maxAge) {
                alert('Min age cannot be greater than max age.');
                return;
            }

            chrome.runtime.sendMessage({
                channel: CHANNEL,
                type: MESSAGE_TYPES.SIDEPANEL_COMMAND,
                payload: {
                    command: COMMANDS.SAVE_SEARCH_SETTINGS,
                    age_min: minAge,
                    age_max: maxAge,
                    verified_profiles_only: verifiedProfilesOnly
                }
            });
        });
    }
}
