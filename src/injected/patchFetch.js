function PatchFetch() {
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
        const res = await origFetch(...args);
        const url = args[0] instanceof Request ? args[0].url : args[0];

        if (typeof url === 'string' && url.includes(encounter_endpoint)) {
            const clone = res.clone();
            const json = await clone.json();
            HandleEncounters(json);
        }

        return res;
    };
}
