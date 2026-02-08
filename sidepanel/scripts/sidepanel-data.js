function getEncounters(callback) {
    chrome.storage.local.get(['encounters'], (result) => {
        const encounters = result.encounters || [];
        encounters.sort((a, b) => {
            const orderA = VoteOrder[getEncounterVoteCode(a)] || VoteOrder[VoteCode.UNKNOWN];
            const orderB = VoteOrder[getEncounterVoteCode(b)] || VoteOrder[VoteCode.UNKNOWN];
            if (orderA !== orderB) return orderA - orderB;
            return (a.name || '').localeCompare(b.name || '');
        });
        callback(encounters);
    });
}
