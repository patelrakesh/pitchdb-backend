/* eslint-disable linebreak-style */
const axios = require('axios');

const MEDIA_API = '/media/public/';

const mediaOutletSearchController = {

    getMediaSearchResults: (req, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + MEDIA_API,
            { 
                headers:
                 { Authorization: authString },
                 params:
                 req.query 
            }
            ).then(response => {
                callback(null, response.data);
            })
            .catch(error => {
                callback(error);
            })
    },

    getMediaParameters: (req, type, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + MEDIA_API + type,
            { 
                headers:
                 { Authorization: authString },
                 params:
                 req.query 
            }
            ).then(response => {
                callback(null, response.data);
            })
            .catch(error => {
                callback(error);
            })
    },

}

module.exports = mediaOutletSearchController;