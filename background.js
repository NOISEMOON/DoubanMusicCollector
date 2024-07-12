importScripts('lodash.js');

console.log("background console starts");
console.log(_.unescape("&amp;"));

let meta = null; // metadata

let getActiveTab = () => {
    return chrome.tabs.query({ active: true, currentWindow: true });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("received content message.");
    switch (msg.page) {
        case "bandcamp":
        case "discogs":
        case "apple":
        case "163":
        case "spotify":
            // case "soundcloud": // TODO
            console.log("Metadata received in background: " + msg.meta);
            if (msg.meta === undefined) {
                console.log("msg.meta undefined.");
                return;
            }
            meta = JSON.parse(msg.meta);
            if (meta['imgUrl']) {
                chrome.downloads.download({ url: meta['imgUrl'] }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.log("Image download failed: " + chrome.runtime.lastError.message);
                    } else {
                        console.log('Image downloaded with ID: ' + downloadId);
                    }
                });
            }
            break;
        case "douban-1":
            if (meta) {
                console.log("Douban-1 message received and meta is stored in background.");
                getActiveTab().then((tabs) => {
                    let metaJSON = _.unescape(JSON.stringify(meta));
                    chrome.tabs.sendMessage(tabs[0].id, { 'meta': metaJSON });
                    meta = null;
                });
            }
            break;
    }
});

console.log("background console ends");