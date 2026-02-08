function HandleEncounters(json) {
    const results = json?.body?.[0]?.client_encounters?.results;
    if (Array.isArray(results)) {
        const encounters = results.map(enc => {
            const instance = new Encounter(enc);
            return instance;
        });
        window.postMessage({
            type: 'new_encounters',
            encounters: encounters
        });
    }
}
