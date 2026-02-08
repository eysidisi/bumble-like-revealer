function renderEncounter(encounter) {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = (encounter?.name || 'Unknown') + ' ';
    li.appendChild(nameSpan);

    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'Details';
    li.appendChild(detailsButton);

    const swipeLeftButton = document.createElement('button');
    swipeLeftButton.textContent = 'Swipe Left';
    swipeLeftButton.className = 'swipe-left-btn';
    swipeLeftButton.setAttribute('data-person-id', encounter?.user_id || '');
    li.appendChild(swipeLeftButton);

    const swipeRightButton = document.createElement('button');
    swipeRightButton.textContent = 'Swipe Right';
    swipeRightButton.className = 'swipe-right-btn';
    swipeRightButton.setAttribute('data-person-id', encounter?.user_id || '');
    li.appendChild(swipeRightButton);

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'details';
    detailsDiv.style.display = 'none';

    // ID
    const idP = document.createElement('p');
    idP.textContent = `ID: ${encounter?.user_id || 'N/A'}`;
    detailsDiv.appendChild(idP);

    // Status
    const statusP = document.createElement('p');
    statusP.textContent = `Status: ${getEncounterVoteStatus(encounter)}`;
    detailsDiv.appendChild(statusP);

    // Photos button
    const photosButton = document.createElement('button');
    photosButton.textContent = 'Photos';
    detailsDiv.appendChild(photosButton);

    // Photos div
    const photosDiv = document.createElement('div');
    photosDiv.style.display = 'none';
    if (encounter?.photoUrls && encounter.photoUrls.length > 0) {
        encounter.photoUrls.forEach((url, index) => {
            let fullUrl = url;
            if (!fullUrl.startsWith('http')) {
                fullUrl = 'https://' + fullUrl;
            }
            const a = document.createElement('a');
            a.href = fullUrl;
            a.target = '_blank';
            a.textContent = `Photo ${index + 1}`;
            photosDiv.appendChild(a);
            photosDiv.appendChild(document.createElement('br'));
        });
    } else {
        photosDiv.textContent = 'No photos';
    }
    detailsDiv.appendChild(photosDiv);

    photosButton.onclick = () => {
        const isVisible = photosDiv.style.display !== 'none';
        photosDiv.style.display = isVisible ? 'none' : 'block';
        photosButton.textContent = isVisible ? 'Photos' : 'Hide Photos';
    };

    li.appendChild(detailsDiv);

    detailsButton.onclick = () => {
        const isVisible = detailsDiv.style.display !== 'none';
        detailsDiv.style.display = isVisible ? 'none' : 'block';
        detailsButton.textContent = isVisible ? 'Details' : 'Hide';
    };

    const voteCode = getEncounterVoteCode(encounter);
    if (voteCode === VoteCode.LIKED) {
        li.classList.add('liked');
    } else if (voteCode === VoteCode.DISLIKED) {
        li.classList.add('disliked');
    } else if (voteCode === VoteCode.HAVENT_SEEN) {
        li.classList.add('not-seen');
    }

    return li;
}
