(function bootstrapBumbleLikeRevealer(root) {
    if (root.__BLR_BOOTSTRAPPED__) return;
    root.__BLR_BOOTSTRAPPED__ = true;

    const CHANNEL = 'blr';
    const MESSAGE_TYPES = Object.freeze({
        PAGE_NEW_ENCOUNTERS: 'blr/page/new-encounters',
        CONTENT_TO_PAGE_COMMAND: 'blr/content/command'
    });
    const COMMANDS = Object.freeze({
        SEND_VOTE: 'send_vote',
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

    const ENCOUNTERS_ENDPOINT = 'SERVER_GET_ENCOUNTERS';
    const BUMBLE_API_URL = 'https://sam1.bumble.com/mwebapi.phtml';
    const DEFAULT_SECRET = 'whitetelevisionbulbelectionroofhorseflying';

    function normalizeVoteCode(voteCode) {
        if (voteCode === VOTE_CODES.HAVENT_SEEN || voteCode === VOTE_CODES.LIKED || voteCode === VOTE_CODES.DISLIKED) {
            return voteCode;
        }

        if (typeof voteCode === 'string') {
            const parsed = Number.parseInt(voteCode, 10);
            if (parsed === VOTE_CODES.HAVENT_SEEN || parsed === VOTE_CODES.LIKED || parsed === VOTE_CODES.DISLIKED) {
                return parsed;
            }
        }

        return VOTE_CODES.UNKNOWN;
    }

    function toEncounter(rawEncounter) {
        const user = rawEncounter?.user || {};
        const voteCode = normalizeVoteCode(user.their_vote);

        return {
            user_id: user.user_id || '',
            name: user.name || '',
            age: user.age || 0,
            location: user.distance_short || '',
            occupation: user.profile_summary?.primary_text || '',
            photoUrls: user.albums?.[0]?.photos?.map((photo) => photo.large_url).filter(Boolean) || [],
            vote_code: voteCode,
            vote_status: VOTE_STATUS_LABELS[voteCode] || VOTE_STATUS_LABELS[VOTE_CODES.UNKNOWN]
        };
    }

    function emitEncounterEvent(encounters) {
        root.postMessage({
            channel: CHANNEL,
            type: MESSAGE_TYPES.PAGE_NEW_ENCOUNTERS,
            payload: { encounters }
        }, '*');
    }

    function handleEncounters(json) {
        const results = json?.body?.[0]?.client_encounters?.results;
        if (!Array.isArray(results)) return;

        const encounters = results.map(toEncounter);
        emitEncounterEvent(encounters);
    }

    function patchFetch() {
        if (root.__BLR_FETCH_PATCHED__) return;
        if (typeof root.fetch !== 'function') return;
        root.__BLR_FETCH_PATCHED__ = true;

        const originalFetch = root.fetch;
        root.fetch = async (...args) => {
            const response = await originalFetch(...args);
            const requestUrl = args[0] instanceof Request ? args[0].url : args[0];

            if (typeof requestUrl === 'string' && requestUrl.includes(ENCOUNTERS_ENDPOINT)) {
                try {
                    const clonedResponse = response.clone();
                    const json = await clonedResponse.json();
                    handleEncounters(json);
                } catch (error) {
                    console.debug('BLR fetch parse error', error);
                }
            }

            return response;
        };
    }

    function patchXMLHttpRequest() {
        if (root.__BLR_XHR_PATCHED__) return;
        root.__BLR_XHR_PATCHED__ = true;

        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
            this.__blr_request_url = url;
            return originalOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function patchedSend(...args) {
            this.addEventListener('load', function onLoad() {
                const requestUrl = this.__blr_request_url;
                if (typeof requestUrl !== 'string' || !requestUrl.includes(ENCOUNTERS_ENDPOINT)) return;

                try {
                    const json = JSON.parse(this.responseText);
                    handleEncounters(json);
                } catch (error) {
                    console.debug('BLR xhr parse error', error);
                }
            });

            return originalSend.apply(this, args);
        };
    }

    function rotl(value, bits) {
        return (value << bits) | (value >>> (32 - bits));
    }

    function endian(value) {
        if (typeof value === 'number') {
            return (16711935 & rotl(value, 8)) | (4278255360 & rotl(value, 24));
        }
        for (let i = 0; i < value.length; i += 1) value[i] = endian(value[i]);
        return value;
    }

    function utf8StringToBytes(str) {
        const encoded = unescape(encodeURIComponent(str));
        const bytes = [];
        for (let i = 0; i < encoded.length; i += 1) bytes.push(encoded.charCodeAt(i) & 255);
        return bytes;
    }

    function bytesToWords(bytes) {
        const words = [];
        for (let i = 0, bit = 0; i < bytes.length; i += 1, bit += 8) {
            words[bit >>> 5] |= bytes[i] << (24 - (bit % 32));
        }
        return words;
    }

    function wordsToBytes(words) {
        const bytes = [];
        for (let bit = 0; bit < 32 * words.length; bit += 8) {
            bytes.push((words[bit >>> 5] >>> (24 - (bit % 32))) & 255);
        }
        return bytes;
    }

    function bytesToHex(bytes) {
        const hex = [];
        for (let i = 0; i < bytes.length; i += 1) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 15).toString(16));
        }
        return hex.join('');
    }

    function ff(a, b, c, d, x, s, t) {
        const n = a + ((b & c) | (~b & d)) + (x >>> 0) + t;
        return (rotl(n, s) + b) | 0;
    }

    function gg(a, b, c, d, x, s, t) {
        const n = a + ((b & d) | (c & ~d)) + (x >>> 0) + t;
        return (rotl(n, s) + b) | 0;
    }

    function hh(a, b, c, d, x, s, t) {
        const n = a + (b ^ c ^ d) + (x >>> 0) + t;
        return (rotl(n, s) + b) | 0;
    }

    function ii(a, b, c, d, x, s, t) {
        const n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
        return (rotl(n, s) + b) | 0;
    }

    function md5Hex(message) {
        if (message == null) {
            throw new Error(`Illegal argument ${message}`);
        }

        const bytes = utf8StringToBytes(message);
        const words = bytesToWords(bytes);
        const bitLength = 8 * bytes.length;

        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;

        for (let i = 0; i < words.length; i += 1) {
            words[i] =
                (16711935 & ((words[i] << 8) | (words[i] >>> 24))) |
                (4278255360 & ((words[i] << 24) | (words[i] >>> 8)));
        }

        words[bitLength >>> 5] |= 128 << (bitLength % 32);
        words[14 + (((bitLength + 64) >>> 9) << 4)] = bitLength;

        for (let p = 0; p < words.length; p += 16) {
            const aa = a;
            const bb = b;
            const cc = c;
            const dd = d;

            a = ff(a, b, c, d, words[p + 0], 7, -680876936);
            d = ff(d, a, b, c, words[p + 1], 12, -389564586);
            c = ff(c, d, a, b, words[p + 2], 17, 606105819);
            b = ff(b, c, d, a, words[p + 3], 22, -1044525330);
            a = ff(a, b, c, d, words[p + 4], 7, -176418897);
            d = ff(d, a, b, c, words[p + 5], 12, 1200080426);
            c = ff(c, d, a, b, words[p + 6], 17, -1473231341);
            b = ff(b, c, d, a, words[p + 7], 22, -45705983);
            a = ff(a, b, c, d, words[p + 8], 7, 1770035416);
            d = ff(d, a, b, c, words[p + 9], 12, -1958414417);
            c = ff(c, d, a, b, words[p + 10], 17, -42063);
            b = ff(b, c, d, a, words[p + 11], 22, -1990404162);
            a = ff(a, b, c, d, words[p + 12], 7, 1804603682);
            d = ff(d, a, b, c, words[p + 13], 12, -40341101);
            c = ff(c, d, a, b, words[p + 14], 17, -1502002290);
            b = ff(b, c, d, a, words[p + 15], 22, 1236535329);

            a = gg(a, b, c, d, words[p + 1], 5, -165796510);
            d = gg(d, a, b, c, words[p + 6], 9, -1069501632);
            c = gg(c, d, a, b, words[p + 11], 14, 643717713);
            b = gg(b, c, d, a, words[p + 0], 20, -373897302);
            a = gg(a, b, c, d, words[p + 5], 5, -701558691);
            d = gg(d, a, b, c, words[p + 10], 9, 38016083);
            c = gg(c, d, a, b, words[p + 15], 14, -660478335);
            b = gg(b, c, d, a, words[p + 4], 20, -405537848);
            a = gg(a, b, c, d, words[p + 9], 5, 568446438);
            d = gg(d, a, b, c, words[p + 14], 9, -1019803690);
            c = gg(c, d, a, b, words[p + 3], 14, -187363961);
            b = gg(b, c, d, a, words[p + 8], 20, 1163531501);
            a = gg(a, b, c, d, words[p + 13], 5, -1444681467);
            d = gg(d, a, b, c, words[p + 2], 9, -51403784);
            c = gg(c, d, a, b, words[p + 7], 14, 1735328473);
            b = gg(b, c, d, a, words[p + 12], 20, -1926607734);

            a = hh(a, b, c, d, words[p + 5], 4, -378558);
            d = hh(d, a, b, c, words[p + 8], 11, -2022574463);
            c = hh(c, d, a, b, words[p + 11], 16, 1839030562);
            b = hh(b, c, d, a, words[p + 14], 23, -35309556);
            a = hh(a, b, c, d, words[p + 1], 4, -1530992060);
            d = hh(d, a, b, c, words[p + 4], 11, 1272893353);
            c = hh(c, d, a, b, words[p + 7], 16, -155497632);
            b = hh(b, c, d, a, words[p + 10], 23, -1094730640);
            a = hh(a, b, c, d, words[p + 13], 4, 681279174);
            d = hh(d, a, b, c, words[p + 0], 11, -358537222);
            c = hh(c, d, a, b, words[p + 3], 16, -722521979);
            b = hh(b, c, d, a, words[p + 6], 23, 76029189);
            a = hh(a, b, c, d, words[p + 9], 4, -640364487);
            d = hh(d, a, b, c, words[p + 12], 11, -421815835);
            c = hh(c, d, a, b, words[p + 15], 16, 530742520);
            b = hh(b, c, d, a, words[p + 2], 23, -995338651);

            a = ii(a, b, c, d, words[p + 0], 6, -198630844);
            d = ii(d, a, b, c, words[p + 7], 10, 1126891415);
            c = ii(c, d, a, b, words[p + 14], 15, -1416354905);
            b = ii(b, c, d, a, words[p + 5], 21, -57434055);
            a = ii(a, b, c, d, words[p + 12], 6, 1700485571);
            d = ii(d, a, b, c, words[p + 3], 10, -1894986606);
            c = ii(c, d, a, b, words[p + 10], 15, -1051523);
            b = ii(b, c, d, a, words[p + 1], 21, -2054922799);
            a = ii(a, b, c, d, words[p + 8], 6, 1873313359);
            d = ii(d, a, b, c, words[p + 15], 10, -30611744);
            c = ii(c, d, a, b, words[p + 6], 15, -1560198380);
            b = ii(b, c, d, a, words[p + 13], 21, 1309151649);
            a = ii(a, b, c, d, words[p + 4], 6, -145523070);
            d = ii(d, a, b, c, words[p + 11], 10, -1120210379);
            c = ii(c, d, a, b, words[p + 2], 15, 718787259);
            b = ii(b, c, d, a, words[p + 9], 21, -343485551);

            a = (a + aa) >>> 0;
            b = (b + bb) >>> 0;
            c = (c + cc) >>> 0;
            d = (d + dd) >>> 0;
        }

        return bytesToHex(wordsToBytes(endian([a, b, c, d])));
    }

    function safeSerialize(value) {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return String(value);
        }
    }

    function calculateXPingback(payload) {
        const normalizedPayload = payload || {};
        const serialized = safeSerialize(normalizedPayload);
        return md5Hex(`${serialized}${DEFAULT_SECRET}`);
    }

    function sendBumbleRequest(endpoint, messageType, messageId, bodyData, onloadCallback) {
        const body = {
            $gpb: 'badoo.bma.BadooMessage',
            body: [{ message_type: messageType, ...bodyData }],
            message_id: messageId,
            message_type: messageType,
            version: 1,
            is_background: false
        };

        const xPingback = calculateXPingback(body);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BUMBLE_API_URL}?${endpoint}`);
        xhr.setRequestHeader('accept', '*/*');
        xhr.setRequestHeader('accept-language', 'en-IE,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6,en-GB;q=0.5');
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.setRequestHeader('priority', 'u=1, i');
        xhr.setRequestHeader('x-message-type', messageType.toString());
        xhr.setRequestHeader('x-pingback', xPingback);
        xhr.setRequestHeader('x-use-session-cookie', '1');
        xhr.onload = () => onloadCallback(xhr);
        xhr.send(JSON.stringify(body));
    }

    function sendVote(personId, vote) {
        sendBumbleRequest(
            'SERVER_ENCOUNTERS_VOTE',
            80,
            46,
            {
                server_encounters_vote: {
                    person_id: personId,
                    vote,
                    vote_source: 1,
                    game_mode: 0
                }
            },
            (xhr) => {
                const direction = Number(vote) === 2 ? 'right' : 'left';
                console.log(`Swipe ${direction} response:`, xhr.responseText);
            }
        );
    }

    function getUser(personId) {
        sendBumbleRequest(
            'SERVER_GET_USER',
            81,
            47,
            { server_get_user: { person_id: personId } },
            (xhr) => {
                console.log(`Get user response for ${personId}:`, xhr.responseText);
            }
        );
    }

    function getUserList() {
        sendBumbleRequest(
            'SERVER_GET_USER_LIST',
            245,
            12,
            {
                server_get_user_list: {
                    filter: [8],
                    filter_match_mode: [0],
                    folder_id: 6,
                    user_field_filter: { projection: [210, 662, 670, 200, 890, 230, 490, 340, 291, 763] },
                    preferred_count: 21
                }
            },
            (xhr) => {
                console.log('Get user list response:', xhr.responseText);
            }
        );
    }

    function onContentCommand(event) {
        if (event.source !== root) return;

        const data = event.data;
        if (!data || data.channel !== CHANNEL || data.type !== MESSAGE_TYPES.CONTENT_TO_PAGE_COMMAND) return;
        if (!data.payload || typeof data.payload.command !== 'string') return;

        const command = data.payload.command;
        if (command === COMMANDS.SEND_VOTE) {
            sendVote(data.payload.person_id, data.payload.vote);
            return;
        }
        if (command === COMMANDS.GET_USER) {
            getUser(data.payload.person_id);
            return;
        }
        if (command === COMMANDS.GET_USER_LIST) {
            getUserList();
        }
    }

    root.addEventListener('message', onContentCommand);
    patchFetch();
    patchXMLHttpRequest();
}(window));
