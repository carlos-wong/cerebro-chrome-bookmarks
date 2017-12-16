
/**
 * Main bookmarks manager file.
 * Adapted from https://github.com/vutran/browser-bookmarks by vultran
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require('./utils');
const { memoize } = require('cerebro-tools');

/**
 * The name of default Google Chrome profile.
 */
const BOOKMARKS_DEFAULT_PROFILE = 'Default';

/**
 * Cache settings for the bookmarks file
 */
const MEMOIZE_BOOKARMS_CACHE_OPTS = {
    promise: 'then',
    maxAge: 1000 * 60 * 60 * 1, // 1 Hour
    preFetch: true
}

/**
 * Cache settings for search
 */
const MEMOIZE_BOOKARMS_SEARCH_OPTS = {
    promise: 'then',
    maxAge: 1000 * 60 * 60 * 1, // 1 Hour
    preFetch: true
}

/**
 * @param {string} profile The Google Chrome profile name to search
 * @param {string} term The search term
 * @return {array} List of bookmarks that match the specified criteria
 */
const search = memoize((profile, term) => new Promise((resolve, reject) => {  
    let profileName = profile || BOOKMARKS_DEFAULT_PROFILE;
    let bookmarksFile = getBookmarksFilePath(process.platform, profileName);
    
    parseBookmarks(bookmarksFile).then((b) => {
        let filteredBookmarks = b.filter((item => {
            return item.title.toLowerCase().includes(term.toLowerCase());
        }));

        resolve(filteredBookmarks);

    }).catch((err) => {
        console.log(err);
        reject(err);
    });
    
}), MEMOIZE_BOOKARMS_SEARCH_OPTS );

/**
 * Retrieve the path to the Google Chrome  profile.
 *
 * https://www.chromium.org/user-experience/user-data-directory
 *
 * @param {String} profile - The profile name (default: "Default")
 * @return {String} - The full path to chrome bookmarks file
 */
const getBookmarksFilePath = (platform, profile = 'Default') => {
    switch (platform) {
        case 'darwin':
            return path.join(
                os.homedir(),
                'Library',
                'Application Support',
                'Google',
                'Chrome',
                profile,
                'Bookmarks'
            );
        case 'win32':
            return path.join(
                process.env.LOCALAPPDATA,
                'Google',
                'Chrome',
                'User Data',
                profile,
                'Bookmarks'
            );
        case 'linux':
            return path.join(
                os.homedir(),
                '.config',
                'google-chrome',
                profile,
                'Bookmarks'
            );
        default:
            return '';
    }
};

/**
 * Recursively retrieve a list of child nodes of bookmark objects.
 * Flattens the tree and appends a new "folder" property for reference.
 *
 * @param {Object[]}
 * @return {Object[]}
 */
const getChildren = (children) => {
    // build the bookmarks list
    let bookmarks = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === 'folder') {
            const gc = getChildren(child.children);
            for (let j = 0; j < gc.length; j++) {
                const fgc = Object.assign({}, gc[j], {
                    folder: child.name,
                });
                bookmarks.push(fgc);
            }
        } else {
            bookmarks.push(child);
        }
    }
    return bookmarks;
};

/**
 * Normalizes the Chrome bookmark item to our bookmark model.
 *
 * @param {Object} item
 * @return {Object}
 */
const normalize = item => ({
    title: item.name,
    url: item.url,
    favicon: utils.getFavicon(item.url),
    folder: item.folder || '',
});


/**
 * Reads the file and extract the bookmarks.
 *
 * @param {String} file - The path to the bookmarks file
 * @return {Promise} - An array of bookmark objects
 */
const parseBookmarks = memoize((file) => new Promise((resolve, reject) => {

    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            reject(err);
        } else {
            const dataJson = JSON.parse(data);
            if (dataJson.roots) {
                // build the bookmarks list
                let bookmarks = [];
                let keys = Object.keys(dataJson.roots);
                for (let i = 0; i < keys.length; i++) {
                    const folder = keys[i];
                    const rootObject = dataJson.roots[folder];
                    // retrieve child nodes in each root folder
                    // and concatenate to global collection
                    const children = rootObject.children ? getChildren(rootObject.children) : [];
                    if (children.length) {
                        for (let j = 0; j < children.length; j++) {
                            bookmarks.push(children[j]);
                        }
                    }
                }
                const nb = new Array(bookmarks.length);
                for (let i = 0; i < bookmarks.length; i++) {
                    nb[i] = normalize(bookmarks[i]);
                }
                resolve(nb);
            } else {
                resolve([]);
            }
        }
    });
}), MEMOIZE_BOOKARMS_CACHE_OPTS);

module.exports = {
    search
}