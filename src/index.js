'use strict';

const debounce = require('debounce');
const icon = require('../assets/icon.png');
const bookmarks = require('./bookmarks');
const PLUGIN_REGEX = /chrome\s(.*)/;

/**
 * Plugin main entry point
 */
const plugin = ({ term, display, actions, settings }) => {

  let pluginSettings = settings || {};
 
  const match = term.match(PLUGIN_REGEX);

  if (match) {

    let term = match[1].trim();
    if (term.length == 0) {
      display({
        title: 'Keep typing for searching thourgh your Chrome Bookmarks',
        icon: icon
      })
      return;
    }

    searchBookmarks(term, pluginSettings, display, actions);
  }
}

/**
 * Search bookmarks
 */
const searchBookmarks = debounce((term, settings, display, actions) => {

  bookmarks.search('Profile 1', term).then((bookmarksList) => {
    let results = [];
    bookmarksList.forEach((item) => {
      results.push({
        title: item.title,
        icon: icon,
        onSelect: (evemt) => {
          actions.open(item.url);
        }
      })
    });

    if (results.length == 0) {
      display({
        title: `No bookmarks found matching ${term}`,
        icon: icon
      });
    } else {
      display(results);
    }
  }).catch((err) => {
    display({
      title: 'Error fetching bookmarks',
      icon: icon
    });
  });

}, 300);

module.exports = {
  fn: plugin,
  name: 'Chrome Bookmarks',
  keyword: 'chrome',
  icon,
  settings: {
    profileName: { type: 'string' },
  }
};