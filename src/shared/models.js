(function registerSharedModels(root) {
    const VoteCode = Object.freeze({
        UNKNOWN: 0,
        HAVENT_SEEN: 1,
        LIKED: 2,
        DISLIKED: 3
    });

    const VoteStatus = Object.freeze({
        [VoteCode.UNKNOWN]: 'Unknown',
        [VoteCode.HAVENT_SEEN]: 'Haven\'t seen you yet.',
        [VoteCode.LIKED]: 'Already swiped right on you.',
        [VoteCode.DISLIKED]: 'Swiped left.'
    });

    function normalizeVoteCode(voteCode) {
        if (voteCode === VoteCode.HAVENT_SEEN || voteCode === VoteCode.LIKED || voteCode === VoteCode.DISLIKED) {
            return voteCode;
        }

        const parsedVoteCode = Number.parseInt(voteCode, 10);
        if (parsedVoteCode === VoteCode.HAVENT_SEEN || parsedVoteCode === VoteCode.LIKED || parsedVoteCode === VoteCode.DISLIKED) {
            return parsedVoteCode;
        }

        return VoteCode.UNKNOWN;
    }

    class Encounter {
        constructor(data) {
            const user = data?.user || {};
            const voteCode = normalizeVoteCode(user.their_vote);

            this.user_id = user.user_id || '';
            this.name = user.name || '';
            this.age = user.age || 0;
            this.location = user.distance_short || '';
            this.occupation = user.profile_summary?.primary_text || '';
            this.photoUrls = user.albums?.[0]?.photos?.map((photo) => photo.large_url).filter(Boolean) || [];
            this.vote_code = voteCode;
            this.vote_status = VoteStatus[voteCode] || VoteStatus[VoteCode.UNKNOWN];
        }
    }

    class UserListResponse {
        constructor(response) {
            this.userIds = [];
            this.totalCount = 0;
            this.title = '';
            this.description = '';

            if (response?.body?.[0]?.client_user_list) {
                const list = response.body[0].client_user_list;
                this.totalCount = list.total_count || 0;
                this.title = list.title || '';
                this.description = list.description || '';

                if (Array.isArray(list.section)) {
                    this.userIds = list.section.flatMap((section) => {
                        if (!Array.isArray(section?.users)) return [];
                        return section.users.map((user) => user?.user_id).filter(Boolean);
                    });
                }
            }
        }
    }

    class GetUserResponse {
        constructor(response) {
            const data = response?.body?.[0]?.server_get_user || {};
            this.user_id = data.user_id || '';
            this.name = data.name || '';
            this.age = data.age || 0;
            this.location = data.distance_short || '';
            this.occupation = data.profile_summary?.primary_text || '';
            this.photoUrls = data.albums?.[0]?.photos?.map((photo) => photo.large_url).filter(Boolean) || [];
        }
    }

    root.BLR_MODELS = Object.freeze({
        VoteCode,
        VoteStatus,
        normalizeVoteCode,
        Encounter,
        UserListResponse,
        GetUserResponse
    });
}(typeof globalThis !== 'undefined' ? globalThis : window));
