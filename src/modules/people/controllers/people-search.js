/* eslint-disable linebreak-style */
const fs = require('fs');

module.exports = {
  generateQuery: (parameters, callback) => {
    let queryObj = buildQuery(parameters);
    let file = fs.readFileSync('src/modules/people/resources/search/people-search.html', 'utf8');
    file = file.replace("%%QUERY%%", queryObj.query);
    callback(null, file);
  }
};

const buildQuery = queryParams => {
  var queryObj = {
    includes: [],
    excludes: [],
    query: ""
  };

  var sites = {
    linkedin: 'site:linkedin.com/in/* OR site:linkedin.com/pub/* -intitle:"profiles" -inurl:"dir/+" ',
    github: 'site:github.com "joined on" -intitle:"at master" -inurl:"tab" -inurl:"jobs." -inurl:"articles" ',
    google: 'site:plus.google.com inurl:about ',
    facebook: 'site:facebook.com ',
    twitter: 'site:twitter.com -inurl:(search|favorites|status|statuses|jobs) -intitle:(job|jobs) -recruiter -HR -careers ',
    xing: 'site:xing.com/profile/ ',
    stackoverflow: 'site:stackoverflow.com/users '
  };

  var network = 'linkedin';
  queryObj.network = network;
  queryObj.query = sites[network];
  var queryKeywords = [];

  if (!queryParams.exclude) queryParams.exclude = '';

  var kws = queryParams.keywords.split(",");
  for (var k in kws) {
    if (kws[k].charAt(0) === '-') {
      var kw = kws[k].substring(1)
      if (queryParams.exclude === '') {
        queryParams.exclude = kw;
      } else {
        queryParams.exclude += (',' + kw);
      }
    } else {
      queryKeywords.push(kws[k].trim());
    }
  }

  queryKeywords = queryKeywords.map(function (e) { return e.replace(/['"]+/g, '') });
  queryKeywords.forEach(element => {
    if (element)
      queryObj.includes.push(element);
  });

  var queryExcludes = queryParams.exclude.split(",").map(function (e) { return e.trim(); })

  queryExcludes.forEach(element => {
    if (element)
      queryObj.excludes.push(element);
  });

  switch (network) {
    case 'linkedin':
      if (queryParams.country !== 'all' && queryParams.country !== 'US') {
        queryObj.query = queryObj.query.replace(/linkedin\.com/g, queryParams.country + '.linkedin.com');
        queryObj.country = queryParams.country;
      }

      if (queryParams.city) {
        queryKeywords.push(queryParams.city);
        queryObj.city = queryParams.city;
      }

      if (queryParams.state) {
        queryObj.state = queryParams.state;
        if (!queryParams.city)
          queryKeywords.push(queryParams.state);

      }

      if (queryParams.industry) {
        queryKeywords.push(queryParams.industry);
        queryObj.industry = queryParams.industry;
      }

      if (queryParams.jobTitle) {
        queryKeywords.push(queryParams.jobTitle);
        queryObj.jobTitle = queryParams.jobTitle;
      }

      queryKeywords = queryKeywords.map(function (e) { return e.replace(/['"]+/g, '') });
      queryKeywords.forEach(element => {
        if (element)
          queryObj.query += 'AND -inurl:"' + element + '" ';
      });

      /*
      if (queryParams.jobTitle) {
          var tmp_title = queryParams.jobTitle.replace(/['"]+/g, '');
          /*
          if (network == 'linkedin' && $('#current-position-hack').prop('checked'))
              tmp_title += ' ****** - Present'
             
          if (tmp_title !== -1 && tmp_title !== "-1")
              queryObj.query += ' intext:' + tmp_title;
      }
       */
      break;
    /*
case 'github':
    if ($('#github-location').val() != '') {
        queryObj.query += '"' + $('#github-location').val() + '" ';
    }
    break;
case 'google':
    if ($('#google-location').val() != '')
        queryObj.query += '"lives * ' + $('#google-location').val() + '" ';
    if ($('#google-employer').val() != '')
        queryObj.query += '"Works at ' + $('#google-employer').val() + '" ';
    if ($('#google-education').val() == 1)
        queryObj.query += '"attended" ';
    break;
case 'facebook':
    break;
case 'twitter':
    break;
case 'xing':
    break;
case 'stackoverflow':
    if ($('#exclude-nosite').prop('checked'))
        queryObj.query += 'intext:"website * *(com|net|me)" ';
    if ($('#exclude-norep').prop('checked'))
        queryObj.query += '-"0 reputation" ';
    break;
    */
  }



  queryParams.keywords = queryKeywords.join(',');
  if (queryParams.keywords !== '')
    queryObj.query += ' "' + queryKeywords.join('" "') + '"';

  if (queryParams.exclude != '')
    queryObj.query += ' -"' + queryExcludes.join('" -"') + '" ';

  return queryObj;
}