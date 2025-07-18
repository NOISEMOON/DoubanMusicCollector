console.log("sne - ", 'content script starts');

// ====== Utilities ======

let getCurrentPage = () => {
    let match = window.location.href.match(/([\w]+)\.com/);
    let site = match && match[1];
    let page;

    switch (site) {
        case 'douban':
            let nBasic = document.getElementsByClassName('basic').length;
            if (nBasic == 2) page = 'douban-1';
            else if (nBasic > 2) page = 'douban-2';
            else page = 'douban-3';
            break;
        case 'bandcamp':
        case 'discogs':
        case 'soundcloud':
        case '163':
        case 'spotify':
        case 'apple':
            page = site;
            break;
    }
    console.log(page)
    return page
}

const localStorageId = 'DoubanListingMetadata'

// ====== Douban ====== 

let fillDropdown = (dropdown, value, valueIndexMap) => {
    let i = valueIndexMap[value];
    console.log(i);
    if (i || i == 0) dropdown.getElementsByClassName('options')[0].getElementsByClassName('sub')[i].click();
}

// douban listing page 1
let fillDouban1 = (meta, click = false) => {
    console.log('sne,fillDouban1');
    console.log('sne,fillDouban1,meta', meta);

    document.getElementById('p_title').value = meta['album']; // album
    let button;
    if (meta['barcode']) {
        console.log('have barcode');
        document.getElementById('uid').value = meta['barcode']; //barcode
        button = document.getElementsByClassName('submit')[0];
    } else {
        button = document.getElementsByClassName('btn-link')[0];
    }
    if (click) button.click();  //TODO: 保留，为了看log暂时注释
}

// douban listing page 2
let fillDouban2 = (meta, click = false) => {
    document.getElementsByClassName('item basic')[0].getElementsByClassName('input_basic modified')[0].value = meta['album'];
    document.getElementsByClassName('item basic')[1].getElementsByClassName('datepicker input_basic hasDatepicker')[0].value = meta['date'];
    document.getElementsByClassName('item basic')[2].getElementsByClassName('input_basic')[0].value = meta['label'];
    document.getElementsByClassName('item basic')[3].getElementsByClassName('input_basic')[0].value = meta['numberOfDiscs'];
    document.getElementsByClassName('item basic')[4].getElementsByClassName('input_basic')[0].value = meta['isrc'];
    document.getElementsByClassName('item list')[0].getElementsByClassName('input_basic')[0].value = meta['albumAltName'];

    if (meta['artists']) {  //TODO: more than 3 artists
        for (let i = 0; i < Math.min(3, meta['artists'].length); i++) {
            document.getElementsByClassName('item list musicians')[0].getElementsByClassName('input_basic')[i].value = meta['artists'][i];
        }
    }
    // items= // TODO
    fillDropdown(document.getElementsByClassName('dropdown')[0], // genre
        meta['genre'],
        {
            'Blues': 0,
            'Classical': 1,
            'EasyListening': 2,
            'Electronic': 3,
            'Folk': 4,
            'FunkSoulRnB': 5,
            'Jazz': 6,
            'Latin': 7,
            'Pop': 8,
            'Rap': 9,
            'Reggae': 10,
            'Rock': 11,
            'Soundtrack': 12,
            'World': 13
        });
    fillDropdown(document.getElementsByClassName('dropdown')[1], // releaseType
        meta['releaseType'],
        {
            'Album': 0,
            'Compilation': 1,
            'EP': 2,
            'Single': 3,
            'Bootleg': 4,
            'Video': 5
        });
    fillDropdown(document.getElementsByClassName('dropdown')[2], // media
        meta['media'],
        {
            'CD': 0,
            'Digital': 1,
            'Cassette': 2,
            'Vinyl': 3
        });
    document.getElementsByClassName('item text section')[0].getElementsByClassName('textarea_basic')[0].value = meta['tracks'];
    document.getElementsByClassName('item text section')[1].getElementsByClassName('textarea_basic')[0].value = meta['description'];
    document.getElementsByClassName('item text section')[2].getElementsByClassName('textarea_basic')[0].value = meta['reference'];

    if (click) document.getElementsByClassName('submit')[0].click();
}

// douban listing page 3
let fillDouban3 = (meta, click = false) => { // TODO: auto-select image
    return null;

}



// ====== Bancamp/discogs/soundcloud/apple/163 ======

// 点击collect按钮
let createButton = (currentPage) => {
    var button = document.createElement("Button");
    button.innerHTML = "Collect";
    button.style = "top:0;left:0;position:absolute;z-index:9999";
    button.onclick = function () {
        // 收集数据
        let meta = collectMeta(currentPage); // todo:✓
        console.log('sne,browser', browser);//TODO: del test
        console.log('sne,meta', meta); //TODO: del test
        // 把数据发到新页面
        browser.runtime.sendMessage({ page: currentPage, meta: JSON.stringify(meta) });
        // 跳转到新的页面 
        window.open("https://music.douban.com/new_subject");
    };
    document.body.appendChild(button);
}

let formatDate = (dateStr) => {
    // supported format: yyyy年mm月dd日; yyyy/mm/dd; mm/dd/yyyy; month/dd/yyyy; dd/month/yyyy; yyyy; month/yyyy; mm/yyyy； 
    try {
        let spl = dateStr.split(/ ?[, 年月日] ?/).filter(n => n);
        const monthNameMap = { "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06", "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12", "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06", "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12" }
        let month = "01", day = "01", year = 'null';
        if (spl.length == 1) {
            year = dateStr;
        } else if (spl.length == 2) {
            month = spl[0];
            year = spl[1];
        } else if (spl.length >= 3) {
            if (spl[0].match(/\d\d\d\d/)) {
                year = spl[0], month = spl[1], day = spl[2];
            } else {
                year = spl[2];
                month = spl[0];
                day = spl[1]
                if (monthNameMap[String(day).toLowerCase()]) {
                    month = spl[1];
                    day = spl[0];
                }
            }
        } else { return null; }

        month = month.padStart(2, '0').toLowerCase();
        if (monthNameMap[month]) month = monthNameMap[month];
        day = day.padStart(2, '0')
        return `${year}-${month}-${day}`;
    } catch (err) {
        return null
    }
}

let collectMeta = (currentPage) => {
    switch (currentPage) {
        case "bandcamp":
            return collectBandcampMeta();
        case "discogs":
            return collectDiscogsMeta();
        case "soundcloud":
            return collectSoundcloudMeta();
        case "163":
            return collectCloudMusicMeta();
        case "apple":
            return collectAppleMeta();
        case "spotify":
            return collectSpotifyMeta();
        default:
            return null
    }
}

let collectSpotifyMeta = () => {
    // 用 class select 的话会是 document.querySelector('pre.sc-42df6821-0.cFFVtY').innerHTML
    // 但这个 class name 看起来像是加密或者随机生成的，不知道以后会不会变
    let htmlString = document.querySelectorAll('pre')[1].innerHTML;
    let jsonString = htmlString.replace(/<[^>]*>/g, '');
    let jsonData = JSON.parse(jsonString);
    let tracks = jsonData.tracks.items.map(item => `${item.track_number} ${item.name}`).join('\n');
    let albumType = jsonData.album_type;
    
    // Spotify 只有 "album", "single", "compilation"
    let releaseType = 'Album';
    if (albumType === 'single') {
        releaseType = 'Single';
    } else if (albumType === 'compilation') {
        releaseType = 'Compilation';
    }

    // Single, EP, Album
    out = {
        'url': jsonData.external_urls.spotify,
        'album': jsonData.name,
        'barcode': null,
        'albumAltName': null,
        'artists': jsonData.artists.map(artist => artist.name),
        'genre': '',
        'releaseType': releaseType,
        'media': 'Digital',
        'date': jsonData.release_date,
        'label': jsonData.label,
        'numberOfDiscs': "1",
        'tracks': tracks,
        'isrc': "",
        'description': "",
        'imgUrl': jsonData.images[0].url,
        'reference': jsonData.external_urls.spotify
    }
    return out;
}

let collectBandcampMeta = () => {
    out = {
        'url': document.URL,
        'album': document.getElementById('name-section').children[0].textContent.trim(),
        'barcode': null,
        'albumAltName': null,
        'artists': [document.getElementById('name-section').children[1].getElementsByTagName('span')[0].textContent.trim()],
        'genre': 'Electronic',
        'releaseType': 'Album', // Not labeled on Bandcamp
        'media': 'Digital', // Not labeled on Bandcamp
        'date': document.getElementsByClassName("tralbumData tralbum-credits")[0].textContent.trim().split('\n')[0].replace('released ', ''),
        'label': "Self-Released", // Bandcamp doesn't have a generic way for label
        'numberOfDiscs': "1",
        'isrc': null,
        'tracks': Array.from(document.getElementById('track_table').children[0].getElementsByClassName("track_row_view")).map((ele) => {
            return ele.textContent.replaceAll(/[\n\t ]+/g, ' ').replace(/ *buy track */, '').replace(/ *lyrics */, '').replace(/ *video */, '').trim()
        }).join('\n').trim(),
        'description': document.URL,
        'imgUrl': document.getElementById('tralbumArt').children[0].href
    }
    out['date'] = formatDate(out['date']);
    try {
        out['description'] += "\n\n" + document.getElementsByClassName("tralbumData tralbum-about")[0].textContent.trim()
    } catch (err) { }
    return out;
}

let collectDiscogsMeta = () => {
    out = {}
    let keys = ['url', 'album', 'barcode', 'albumAltName', 'artists', 'genre', 'releaseType', 'media', 'date', 'label', 'numberOfDiscs', 'isrc', 'tracks', 'description', 'imgUrl']
    for (const key of keys) out[key] = null;

    out['url'] = document.URL;
    
    // First try to extract data from release_schema JSON-LD script
    try {
        let schemaScript = document.getElementById('release_schema');
        if (schemaScript) {
            let schemaData = JSON.parse(schemaScript.textContent);
            console.log('Found release_schema data:', schemaData);
            
            // Extract data from JSON-LD
            if (schemaData.name) {
                out['album'] = schemaData.name;
            }
            
            if (schemaData.releaseOf && schemaData.releaseOf.byArtist) {
                out['artists'] = schemaData.releaseOf.byArtist.map(artist => artist.name);
            }
            
            if (schemaData.genre && Array.isArray(schemaData.genre)) {
                out['genre'] = schemaData.genre[0]; // Use first genre
            }
            
            if (schemaData.datePublished) {
                out['date'] = schemaData.datePublished.toString();
            }
            
            if (schemaData.recordLabel && schemaData.recordLabel.length > 0) {
                out['label'] = schemaData.recordLabel[0].name;
            }
            
            if (schemaData.musicReleaseFormat) {
                out['media'] = schemaData.musicReleaseFormat;
            }
            
            if (schemaData.image) {
                out['imgUrl'] = schemaData.image;
            }
            
            if (schemaData["@id"]) {
                out['reference'] = schemaData["@id"];
            }
            // if (schemaData.catalogNumber) {
            //     out['barcode'] = schemaData.catalogNumber;
            // }
            
            // Extract additional information from offers if available
            if (schemaData.offers && schemaData.offers.itemOffered) {
                if (schemaData.offers.itemOffered.name && !out['album']) {
                    // Extract album name from offer if not already set
                    let offerName = schemaData.offers.itemOffered.name;
                    // Usually in format "Artist - Album", extract album part
                    let dashIndex = offerName.lastIndexOf(' - ');
                    if (dashIndex !== -1) {
                        out['album'] = offerName.substring(dashIndex + 3);
                    }
                }
            }
            
            // Try to extract description from JSON-LD if available
            // if (schemaData.description && !out['description']) {
            //     out['description'] = schemaData.description;
            // }
            
            console.log('Extracted from JSON-LD:', out);
        }
    } catch (err) {
        console.error('Error parsing release_schema JSON-LD:', err);
    }
    
    // Fallback: Extract album title and artist using DOM selectors if not found in JSON-LD
    if (!out['album'] || !out['artists']) {
        try {
            // Use MUI class names which are more stable than generated hash suffixes
            let titleElement = document.querySelector('h1.MuiTypography-headLineXL') || 
                              document.querySelector('h1[class*="title_"]');
            if (titleElement) {
                // Get album title (text after the artist link and dash)
                let titleText = titleElement.textContent.trim();
                let artistLink = titleElement.querySelector('a');
                if (artistLink) {
                    // Extract album name after artist name and dash
                    let artistName = artistLink.textContent.trim();
                    if (!out['artists']) out['artists'] = [artistName];
                    // Album title is usually after " – "
                    let albumStart = titleText.indexOf(' – ');
                    if (albumStart !== -1) {
                        if (!out['album']) out['album'] = titleText.substring(albumStart + 3).trim();
                    } else {
                        if (!out['album']) out['album'] = titleText.replace(artistName, '').trim();
                    }
                } else {
                    if (!out['album']) out['album'] = titleText;
                    if (!out['artists']) out['artists'] = ['Unknown Artist'];
                }
            }
        } catch (err) {
            console.error('Error extracting title/artist:', err);
        }
    }

    // Fallback: Extract info from the info table using DOM selectors if not found in JSON-LD
    try {
        // Look for info container and table within it, without relying on specific hash classes
        let infoContainer = document.querySelector('div[class*="info_"] table') ||
                           document.querySelector('table[class*="table_"]');
        if (infoContainer) {
            let infoTable = infoContainer.querySelector('tbody') || infoContainer;
            let rows = infoTable.getElementsByTagName('tr');
            for (let row of rows) {
                let header = row.querySelector('th h2') || row.querySelector('th');
                let data = row.querySelector('td');
                if (header && data) {
                    let key = header.textContent.replace(':', '').trim();
                    let value = data.textContent.trim();
                    
                    switch (key) {
                        case 'Label':
                            if (!out['label']) {
                                // Extract label name (before catalog number)
                                let labelLink = data.querySelector('a');
                                if (labelLink) {
                                    out['label'] = labelLink.textContent.trim();
                                } else {
                                    let parts = value.split(' – ');
                                    out['label'] = parts[0].trim();
                                }
                            }
                            break;
                        case 'Format':
                            if (!out['media']) {
                                // Extract format info
                                let formatLink = data.querySelector('a');
                                if (formatLink) {
                                    out['media'] = formatLink.textContent.trim();
                                } else {
                                    out['media'] = value.split(',')[0].trim();
                                }
                            }
                            break;
                        case 'Released':
                            if (!out['date']) {
                                let dateLink = data.querySelector('a time');
                                if (dateLink) {
                                    out['date'] = dateLink.getAttribute('datetime') || dateLink.textContent.trim();
                                } else {
                                    out['date'] = value;
                                }
                            }
                            break;
                        case 'Genre':
                            if (!out['genre']) {
                                let genreLink = data.querySelector('a');
                                if (genreLink) {
                                    out['genre'] = genreLink.textContent.trim();
                                } else {
                                    out['genre'] = value;
                                }
                            }
                            break;
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error extracting info table:', err);
    }

    // Set defaults if not found
    if (!out['media']) out['media'] = 'Vinyl';
    if (!out['label']) out['label'] = 'Self-Released';
    if (out['date']) out['date'] = formatDate(out['date']);
    if (!out['releaseType']) out['releaseType'] = 'Album';
    if (!out['numberOfDiscs']) out['numberOfDiscs'] = "1";

    // Extract tracks using stable ID and data attributes (JSON-LD usually doesn't include tracklist)
    if (!out['tracks']) {
        try {
            // Use the stable ID selector first, fallback to other methods
            let tracklist = document.querySelector('#release-tracklist tbody') || 
                           document.querySelector('section[id*="tracklist"] tbody') ||
                           document.querySelector('table[class*="tracklist"] tbody');
            let trackText = "";
            if (tracklist) {
                let trackRows = tracklist.getElementsByTagName('tr');
                for (let row of trackRows) {
                    // Use data attributes which are more stable
                    let trackPosition = row.getAttribute('data-track-position');
                    if (trackPosition) {
                        // Find track title in nested spans or any element containing track title
                        let titleElement = row.querySelector('td:last-child span:last-child') ||
                                         row.querySelector('td[class*="trackTitle"] span:last-child') ||
                                         row.querySelector('td:last-child');
                        
                        if (titleElement) {
                            let trackTitle = titleElement.textContent.trim();
                            trackText += `${trackPosition} - ${trackTitle}\n`;
                        }
                    } else {
                        // Fallback to positional extraction
                        let posElement = row.querySelector('td:first-child') ||
                                       row.querySelector('td[class*="trackPos"]');
                        let titleElement = row.querySelector('td:last-child span:last-child') ||
                                         row.querySelector('td[class*="trackTitle"]');
                        
                        if (posElement && titleElement) {
                            let trackPos = posElement.textContent.trim();
                            let trackTitle = titleElement.textContent.trim();
                            trackText += `${trackPos} - ${trackTitle}\n`;
                        }
                    }
                }
            }
            out['tracks'] = trackText;
        } catch (err) {
            console.error('Error extracting tracks:', err);
            out['tracks'] = '';
        }
    }

    // Fallback: Extract image URL using DOM selectors if not found in JSON-LD
    if (!out['imgUrl']) {
        try {
            // Find element with data-images attribute using multiple selector strategies
            let imageGalleryElement = 
                // Try original selector first
                (document.getElementById('page_content') && 
                 document.getElementById('page_content').getElementsByClassName("image_gallery")[0]) ||
                // Try finding any element with data-images attribute
                document.querySelector('[data-images]') ||
                // Try finding image_gallery class anywhere in document
                document.getElementsByClassName("image_gallery")[0] ||
                // Try variations of class names
                document.querySelector('[class*="image_gallery"]') ||
                document.querySelector('[class*="imageGallery"]') ||
                document.querySelector('[class*="image-gallery"]');

            if (imageGalleryElement && imageGalleryElement.attributes['data-images']) {
                out['imgUrl'] = JSON.parse(imageGalleryElement.attributes['data-images'].nodeValue)[0]['full'];
            }
        } catch (err) {
            console.error('Error extracting image with DOM logic:', err);
        }
    }

    // Handle genre mapping
    const valueRenameMap = { 'Hip Hop': 'Rap' };
    if (out['genre'] && valueRenameMap[out['genre']]) {
        out['genre'] = valueRenameMap[out['genre']];
    }

    return out;
}

let collectSoundcloudMeta = () => { // TODO
    return null
}

let collectAppleMeta = () => { // TODO
    out = {}
    let keys = ['url', 'album', 'barcode', 'albumAltName', 'artists', 'genre', 'releaseType', 'media', 'date', 'label', 'numberOfDiscs', 'isrc', 'tracks', 'description', 'imgUrl']
    for (const key of keys) out[key] = null;

    out['url'] = document.URL;
    out['album'] = document.getElementsByClassName('headings')[0].children[0].textContent.trim();
    out['barcode'] = null;
    out['artists'] = [document.getElementsByClassName('headings')[0].children[1].textContent.trim()];
    let genre = document.getElementsByClassName('headings')[0].children[2].textContent.trim().split("·")[0].trim();
    const genreNameMap = { 'Dance': 'Electronic', 'Hip-Hop': 'Rap', 'HipHop': 'Rap', 'Alternative': 'Rock', "Hip-Hop/Rap": 'Rap' };
    if (genre && genreNameMap[genre]) out['genre'] = genreNameMap[genre];
    out['releaseType'] = 'Album'; // TODO
    out['media'] = 'Digital';
    // out['date']=document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-released-container')[0].textContent.replace("RELEASED",'').trim() // TODO:convert
    out['date'] = document.getElementsByClassName("footer-body")[0].getElementsByClassName('description')[0].textContent.trim() // TODO:convert
    out['date'] = formatDate(out['date']);
    try {
        out['label'] = document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-copyright')[0].textContent.replace(/℗ \d+ /, '');
    } catch (err) { }
    out['numberOfDiscs'] = "1";

    // tracks
    let tracksText = "";
    let songs = document.getElementsByClassName("songs-list")[0].getElementsByClassName('song-name');
    for (i = 0; i < songs.length; i++) {
        tracksText += `${i + 1}. ${songs[i].textContent.trim()}\n`;
    }
    out['tracks'] = tracksText

    out['description'] = out['url']
    try {
        out['description'] = '\n\n' + document.getElementsByClassName('product-page-header')[0].getElementsByClassName('truncated-content-container')[0].textContent.replace(/Editors’ Notes/, '').trim()
    } catch (err) { }

    try {
        let _arr = document.getElementsByClassName('product-info')[0].getElementsByTagName('source')[1].srcset.split(" ");
        out['imgUrl'] = _arr[_arr.length - 2];
    } catch (err) { }
    return out;
}

let collectCloudMusicMeta = () => {
    console.log("sne:startCollect163Meta")
    let keys = ['url', 'album', 'barcode', 'albumAltName', 'artists', 'genre', 'releaseType', 'media', 'date', 'label', 'numberOfDiscs', 'isrc', 'tracks', 'description', 'imgUrl']
    out = {}
    for (const key of keys) out[key] = null;

    out['url'] = document.URL;
    var doc = document.getElementById("g_iframe").contentWindow.document;
    out['album'] = doc.querySelector("h2.f-ff2").textContent;
    out['artists'] = [doc.querySelector("p:nth-child(2)").textContent.substr(3).trim()];
    out['date'] = doc.querySelector("p:nth-child(3)").textContent.substr(5);

    // 出版者
    if (doc.getElementsByClassName('intr')[2]) {
        out['label'] = doc.getElementsByClassName('intr')[2].textContent.substr(6).trim();
    } else {
        out['label'] = doc.querySelector("a.s-fc7").textContent; // default: 歌手
    }

    // tracks
    let tracks = doc.querySelector("table");
    let trackText = "";
    for (var i = 1, rows = tracks.rows.length; i < rows; i++) {
        let track = tracks.rows[i].cells[1];
        let trackPos = (i).toString();
        let trackTitle = ''
        let es = track.querySelector('a > b');
        if (es) trackTitle = es.attributes.title.textContent;
        trackText += `${trackPos} - ${trackTitle}\n`;
    }
    out['tracks'] = trackText;

    // description
    out['description'] = '';
    if (doc.getElementById('album-desc-more')) out['description'] = doc.getElementById('album-desc-more').innerText;
    else if (doc.getElementById('album-desc-dot')) out['description'] = doc.getElementById('album-desc-dot').innerText;

    // imgurl
    try {
        let imgURL = doc.querySelector("div.cover.u-cover.u-cover-alb > img").src; // substr去掉了尺寸缩减的param);
        // let _arr=doc.querySelector("div.cover.u-cover.u-cover-alb > img").src;
        let u = imgURL.substr(0, imgURL.length - 14);
        console.log('sne,imgurl4', u);
        out['imgUrl'] = u; // substr去掉了尺寸缩减的param;
    } catch (err) { }

    console.log("sne - out:", out);
    return out;
}


// ====== Testing ======

let _metaTest = {
    'album': 'album',
    'barcode': null, //"727361514624"
    'albumAltName': 'albumAltName',
    'artists': ['artist'],
    'genre': 'genre',
    'releaseType': 'releaseType',
    'media': 'media',
    'date': 'date',
    'label': 'label',
    'numOfDiscs': 'numOfDiscs',
    'isrc': 'isrc',
    'tracks': 'tracks',
    'description': 'description'
}

// console.log("Testing plugin");
// console.log(getCurrentPage());


// ====== Main ======

//let meta=_metaTest;
let currentPage = getCurrentPage();

// Default action: add buttons to bandcamp/discogs/soundcloud/apple pages
switch (currentPage) {
    case 'bandcamp':
    case 'discogs':
    case 'apple':
    case '163':
    case 'spotify':
        // case 'soundcloud':
        createButton(currentPage);
    case 'douban-1':
    case 'douban-2':
    case 'douban-3':
        browser.runtime.sendMessage({ page: currentPage });
        break;
}

// listens to background script message
// only get message on douban-1 opened by the bandcamp button
browser.runtime.onMessage.addListener(message => {
    console.log("Message from the background script:");
    console.log(message);
    if (message.meta) {
        let metaBackground = JSON.parse(message.meta)
        console.log("sne,test,metaBackground", metaBackground);
        if (currentPage == 'douban-1') {
            fillDouban1(metaBackground, click = true);
            localStorage.setItem(localStorageId, JSON.stringify(metaBackground));
        }
    }

});

// autofill douban-2 if meta is stored to localStorage
let metaStored = localStorage.getItem(localStorageId)
if (metaStored) {
    console.log("sne - metaStored2");
    metaStored = JSON.parse(metaStored);
    if (currentPage == 'douban-2') {
        fillDouban2(metaStored, click = false);
    }
    localStorage.removeItem(localStorageId);
}

console.log('content script ends');


// TODO
// https://www.discogs.com/Various-Sweet-House-Chicago/master/79323
// https://adaptedrecords.bandcamp.com/album/freedom
// https://music.apple.com/cn/album/%E6%90%96%E6%BB%BE86/1391495014 (date)
// get track duration on apple music
// https://www.discogs.com/Greekboy-Shaolin-Technics/release/11434711 (format)
// https://music.apple.com/us/album/the-palmwine-express/1491006159 (url)
// https://www.discogs.com/Various-Starship-The-De-Lite-Superstars/release/569725 (genre name map)
// https://www.discogs.com/Richard-Groove-Holmes-Soul-Power/release/2997598 (artist)
// [FIXED] bc track list sometimes has extra space (https://lbrecordings.bandcamp.com/album/l-b020-hyperromantic-isle-of-dead-ep)
// Master page on discogs grab label from the first release. 
// Recognize digital on discog from format like this https://www.discogs.com/DJ-Trax-Find-A-Way-EP/release/16466505 
// Recognize artist/duration on apple music like this https://music.apple.com/us/album/lo-fi-house-zip/1490994043
// Auto recognize EP in album title: https://how2make.bandcamp.com/album/vortex-ep
// Recognize label on bandcamp from side column (if label==artist then use self-released)
// Recognize "12''" on discogs https://www.discogs.com/Wax-Doctor-Cruise-Control-EP/release/90227 
// guess a release is EP/album by track count/track list numbering
// Multiple artists on bandcamp? 
// Add tags onto bandcamp description