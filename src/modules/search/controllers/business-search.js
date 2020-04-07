/* eslint-disable linebreak-style */
const axios = require('axios');

const BUSINESS_API = '/businesses/public/';

const businessSearchController = {

    getBusinessSearchResults: (req, type, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + BUSINESS_API + type,
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

    getLocalBusinessById: (businessId, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + BUSINESS_API + "local/" + businessId,
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

module.exports = businessSearchController;