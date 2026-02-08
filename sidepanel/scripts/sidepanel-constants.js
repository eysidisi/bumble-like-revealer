const { CHANNEL, COMMANDS, MESSAGE_TYPES, VOTE_CODES, VOTE_STATUS_LABELS, normalizeVoteCode } = window.BLR_CONTRACTS;

const VoteCode = VOTE_CODES;
const VoteStatus = VOTE_STATUS_LABELS;

const VoteOrder = {
    [VoteCode.LIKED]: 1,
    [VoteCode.HAVENT_SEEN]: 2,
    [VoteCode.DISLIKED]: 3,
    [VoteCode.UNKNOWN]: 999
};

function getEncounterVoteCode(encounter) {
    return normalizeVoteCode(encounter?.vote_code, encounter?.vote_status);
}

function getEncounterVoteStatus(encounter) {
    const voteCode = getEncounterVoteCode(encounter);
    return VoteStatus[voteCode] || VoteStatus[VoteCode.UNKNOWN];
}
