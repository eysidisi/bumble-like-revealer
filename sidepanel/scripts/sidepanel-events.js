function setupEvents(list, toggleButton, expandAllBtn) {
    let isCollapsed = false;

    toggleButton.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        list.style.display = isCollapsed ? 'none' : 'block';
        toggleButton.textContent = isCollapsed ? 'Expand' : 'Collapse';
        if (isCollapsed) {
            // Collapse all details
            const detailsDivs = list.querySelectorAll('.details');
            detailsDivs.forEach(div => div.style.display = 'none');
            // Reset button texts
            const buttons = list.querySelectorAll('button');
            buttons.forEach(btn => {
                if (btn.textContent === 'Hide') btn.textContent = 'Details';
                if (btn.textContent === 'Hide Photos') btn.textContent = 'Photos';
            });
        }
    });

    expandAllBtn.addEventListener('click', () => {
        // Ensure the list is visible
        if (isCollapsed) {
            list.style.display = 'block';
            toggleButton.textContent = 'Collapse';
            isCollapsed = false;
        }
        // Expand all details
        const detailsDivs = list.querySelectorAll('.details');
        detailsDivs.forEach(div => div.style.display = 'block');
        // Expand all photos
        const photosDivs = list.querySelectorAll('.details > div');
        photosDivs.forEach(div => div.style.display = 'block');
        // Set button texts
        const buttons = list.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent === 'Details') btn.textContent = 'Hide';
            if (btn.textContent === 'Photos') btn.textContent = 'Hide Photos';
        });
    });

    list.addEventListener('click', (event) => {
        if (event.target.classList.contains('swipe-left-btn')) {
            if (confirm('Are you sure to swipe left?')) {
                const personId = event.target.getAttribute('data-person-id');
                chrome.runtime.sendMessage({ type: 'send_vote', person_id: personId, vote: 3 });
            }
        }
        if (event.target.classList.contains('swipe-right-btn')) {
            if (confirm('Are you sure to swipe right?')) {
                const personId = event.target.getAttribute('data-person-id');
                chrome.runtime.sendMessage({ type: 'send_vote', person_id: personId, vote: 2 });
            }
        }
    });
}
