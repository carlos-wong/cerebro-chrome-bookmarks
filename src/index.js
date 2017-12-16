const debounce = require('debounce');
const icon = require('../assets/icon.png');
const bookmarks = require('./bookmarks');

/**
 * Plugin main entry point
 */
const plugin = ({ term, display, actions, settings }) => {
  searchBookmarks(term, settings, display, actions);
};

/**
 * Search bookmarks
 */
const searchBookmarks = debounce((term, settings, display, actions) => {

  bookmarks.search(settings.profileName, term).then((bookmarksList) => {
    let results = [];
    bookmarksList.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: item.folder,
        icon: icon,
        onSelect: (evemt) => {
          actions.open(item.url);
        }
      })
    });

    if (results.length > 0) {
      display(results);
    } 
  }).catch((err) => {
    console.err(err);
  });

}, 300);

module.exports = {
  fn: plugin,
  name: 'Chrome Bookmarks',
  icon,
  settings: {
    profileName: { type: 'string' },
  }
};