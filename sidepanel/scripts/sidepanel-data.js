function getEncounters(callback) {
    chrome.storage.local.get(['encounters'], (result) => {
        const encounters = result.encounters || [];
        // Sort encounters: liked first, not seen second, disliked last, then alphabetically by name
        const order = {
            [VoteStatus.LIKED]: 1,
            [VoteStatus.HAVENT_SEEN]: 2,
            [VoteStatus.DISLIKED]: 3
        };
        encounters.sort((a, b) => {
            const orderA = order[a.vote_status] || 999;
            const orderB = order[b.vote_status] || 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.name || '').localeCompare(b.name || '');
        });
        callback(encounters);
    });
}
