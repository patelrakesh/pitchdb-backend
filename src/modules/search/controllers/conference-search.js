/* eslint-disable linebreak-style */
const axios = require('axios');

const CONFERENCES_API = '/conferences/public/';

const ConferenceSearchController = {

    getConferenceSearchResults: (req, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + CONFERENCES_API,
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

    getConferenceParameters: (type, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + CONFERENCES_API + type,
            { 
                headers:
                 { Authorization: authString }
            }
            ).then(response => {
                callback(null, response.data);
            })
            .catch(error => {
                callback(error);
            })
    },
}

module.exports = ConferenceSearchController;