function sendVote(person_id, vote) {
    const body = { "$gpb": "badoo.bma.BadooMessage", "body": [ { "message_type": 80, "server_encounters_vote": { "person_id": person_id, "vote": vote, "vote_source": 1, "game_mode": 0 } } ], "message_id": 46, "message_type": 80, "version": 1, "is_background": false };
    const xPingback = self.calculateXPingback(body);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://sam1.bumble.com/mwebapi.phtml?SERVER_ENCOUNTERS_VOTE');
    xhr.setRequestHeader('accept', '*/*');
    xhr.setRequestHeader('accept-language', 'en-IE,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6,en-GB;q=0.5');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.setRequestHeader('priority', 'u=1, i');
    xhr.setRequestHeader('priority', 'u=1, i');
    xhr.setRequestHeader('x-message-type', '80');
    xhr.setRequestHeader('x-pingback', xPingback);
    xhr.setRequestHeader('x-use-session-cookie', '1');
    xhr.onload = () => {
        const direction = vote === 2 ? 'right' : 'left';
        console.log(`Swipe ${direction} response:`, xhr.responseText);
    };
    xhr.send(JSON.stringify(body));
}


self.sendVote = sendVote;
