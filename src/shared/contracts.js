(function initContracts(root) {
    const CHANNEL = 'blr';

    const MESSAGE_TYPES = Object.freeze({
        PAGE_NEW_ENCOUNTERS: 'blr/page/new-encounters',
        CONTENT_NEW_ENCOUNTERS: 'blr/content/new-encounters',
        CONTENT_READY: 'blr/content/ready',
        BACKGROUND_TO_CONTENT_COMMAND: 'blr/background/command',
        CONTENT_TO_PAGE_COMMAND: 'blr/content/command',
        SIDEPANEL_COMMAND: 'blr/sidepanel/command',
        REFRESH_ENCOUNTERS: 'blr/background/refresh-encounters'
    });

    const COMMANDS = Object.freeze({
        SEND_VOTE: 'send_vote',
        SEND_MESSAGE: 'send_message',
        GET_USER: 'get_user',
        GET_USER_LIST: 'get_user_list'
    });

    const VOTE_CODES = Object.freeze({
        UNKNOWN: 0,
        HAVENT_SEEN: 1,
        LIKED: 2,
        DISLIKED: 3
    });

    const VOTE_STATUS_LABELS = Object.freeze({
        [VOTE_CODES.UNKNOWN]: 'Unknown',
        [VOTE_CODES.HAVENT_SEEN]: 'Haven\'t seen you yet.',
        [VOTE_CODES.LIKED]: 'Already swiped right on you.',
        [VOTE_CODES.DISLIKED]: 'Swiped left.'
    });

    function isObject(value) {
        return typeof value === 'object' && value !== null;
    }

    function isMessageWithChannel(message) {
        return isObject(message) && message.channel === CHANNEL && typeof message.type === 'string';
    }

    function normalizeVoteCode(voteCode, voteStatusText) {
        if (voteCode === VOTE_CODES.HAVENT_SEEN || voteCode === VOTE_CODES.LIKED || voteCode === VOTE_CODES.DISLIKED) {
            return voteCode;
        }

        if (typeof voteCode === 'string') {
            const parsedVoteCode = Number.parseInt(voteCode, 10);
            if (parsedVoteCode === VOTE_CODES.HAVENT_SEEN || parsedVoteCode === VOTE_CODES.LIKED || parsedVoteCode === VOTE_CODES.DISLIKED) {
                return parsedVoteCode;
            }
        }

        if (typeof voteStatusText === 'string') {
            if (voteStatusText.includes('Already swiped right')) return VOTE_CODES.LIKED;
            if (voteStatusText.includes('Swiped left')) return VOTE_CODES.DISLIKED;
            if (voteStatusText.includes('Haven\'t seen')) return VOTE_CODES.HAVENT_SEEN;
        }

        return VOTE_CODES.UNKNOWN;
    }

    function isPageEncounterEvent(message) {
        const encounters = message?.payload?.encounters;
        return isMessageWithChannel(message) &&
            message.type === MESSAGE_TYPES.PAGE_NEW_ENCOUNTERS &&
            Array.isArray(encounters);
    }

    function isContentEncounterMessage(message) {
        const encounters = message?.payload?.encounters;
        return isMessageWithChannel(message) &&
            message.type === MESSAGE_TYPES.CONTENT_NEW_ENCOUNTERS &&
            Array.isArray(encounters);
    }

    function isContentReadyMessage(message) {
        return isMessageWithChannel(message) && message.type === MESSAGE_TYPES.CONTENT_READY;
    }

    function isBackgroundCommand(message) {
        return isMessageWithChannel(message) && message.type === MESSAGE_TYPES.BACKGROUND_TO_CONTENT_COMMAND && isObject(message.payload);
    }

    function isSidepanelCommandMessage(message) {
        return isMessageWithChannel(message) && message.type === MESSAGE_TYPES.SIDEPANEL_COMMAND && isObject(message.payload);
    }

    root.BLR_CONTRACTS = Object.freeze({
        CHANNEL,
        COMMANDS,
        MESSAGE_TYPES,
        VOTE_CODES,
        VOTE_STATUS_LABELS,
        normalizeVoteCode,
        isMessageWithChannel,
        isPageEncounterEvent,
        isContentEncounterMessage,
        isContentReadyMessage,
        isBackgroundCommand,
        isSidepanelCommandMessage
    });
}(typeof globalThis !== 'undefined' ? globalThis : window));
