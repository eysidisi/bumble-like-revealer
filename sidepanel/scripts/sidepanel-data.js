function getEncounters(sortMode, callback) {
    const effectiveSortMode = sortMode === 'age' ? 'age' : 'name';
    const effectiveCallback = typeof callback === 'function'
        ? callback
        : (typeof sortMode === 'function' ? sortMode : () => {});

    chrome.storage.local.get(['encounters'], (result) => {
        const encounters = result.encounters || [];
        encounters.sort((a, b) => {
            const aLiked = getEncounterVoteCode(a) === VoteCode.LIKED;
            const bLiked = getEncounterVoteCode(b) === VoteCode.LIKED;
            if (aLiked !== bLiked) return aLiked ? -1 : 1;

            if (effectiveSortMode === 'age') {
                const ageA = Number.parseInt(a?.age, 10);
                const ageB = Number.parseInt(b?.age, 10);
                const normalizedAgeA = Number.isFinite(ageA) ? ageA : -1;
                const normalizedAgeB = Number.isFinite(ageB) ? ageB : -1;
                if (normalizedAgeA !== normalizedAgeB) return normalizedAgeB - normalizedAgeA;
            }

            return (a.name || '').localeCompare(b.name || '');
        });
        effectiveCallback(encounters);
    });
}
