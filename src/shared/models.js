// VoteStatus is defined in constants.js and available globally

class Encounter {
    constructor(data) {
        this.user_id = data.user.user_id;
        this.name = data.user.name;
        this.age = data.user.age;
        this.location = data.user.distance_short;
        this.occupation = data.user.profile_summary.primary_text;
        this.photoUrls = data.user.albums[0]?.photos?.map(p => p.large_url) || [];
        this.vote_status = this.getVoteStatus(data.user.their_vote);
    }

    getVoteStatus(vote) {
        if (vote === 2) return window.VoteStatus.LIKED;
        else if (vote === 3) return window.VoteStatus.DISLIKED;
        else if (vote === 1) return window.VoteStatus.HAVENT_SEEN;
        else return `Unknown vote: ${vote}`;
    }
}
