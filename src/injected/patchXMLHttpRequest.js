function PatchXMLHTTPRequest() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._url = url;
        return origOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
            const url = this._url;
            if (typeof url === 'string' && url.includes(encounter_endpoint)) {
                const json = JSON.parse(this.responseText);
                HandleEncounters(json);                
            }
        });

        return origSend.apply(this, args);
    };
}
