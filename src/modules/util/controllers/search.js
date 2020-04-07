const Search = require("../models/search");
//const winston = require('winston');

const SEARCH_PAGE_SIZE = 20;

const searchController = {

  saveSearch: (user, searchObj) => {
    searchObj.keywords = searchController.parseKeywords(searchObj.keywords);
    searchObj.userId = user.userId;
    if (user.teamId) searchObj.teamId = user.teamId;
    if (searchObj.filters.exclude) searchObj.filters.exclude = searchController.parseKeywords(searchObj.filters.exclude);
    else delete searchObj.filters.exclude;
    searchController.parsePodcastSearch(searchObj)
    let newSearch = new Search(searchObj);
    newSearch.save(() => {
      //if(err) winston.warn(err);
    })
  },

  parseKeywords: keywords => {
    if (keywords && keywords.trim()) {
      let splitKeywords = keywords.split("_").map(k => {
        let cleanKeyword = k.trim();
        return cleanKeyword.replace(/['"]+/g, '');
      });
      return splitKeywords;
    }
    else return [];
  },

  parsePodcastSearch: searchObj => {
    if (searchObj.filters.genres && searchObj.filters.genres.length > 0) searchObj.filters.genres = searchController.parseKeywords(searchObj.filters.genres);
    else delete searchObj.filters.genres;
    if (searchObj.filters.publishedBefore) searchObj.filters.publishedBefore = new Date(searchObj.filters.publishedBefore)
    if (searchObj.filters.publishedAfter) searchObj.filters.publishedAfter = new Date(searchObj.filters.publishedAfter)
  },

  getSearches: (req, callback) => {
    // By default the searches are sorted by date
    Search.find({}).sort('-date').skip(req.query.page ? req.query.page * SEARCH_PAGE_SIZE : 0).limit(SEARCH_PAGE_SIZE)
      .populate('userId').exec(callback)
  },

  getSearchCount: (req, callback) => {
    Search.countDocuments({}).exec((err, count) => {
      if (err) callback(err)
      else callback(null, { count, pageSize: SEARCH_PAGE_SIZE })
    })
  }
}

module.exports = searchController