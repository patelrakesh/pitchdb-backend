/* eslint-disable linebreak-style */
const axios = require('axios');

const EVENT_API = '/event-organizations/public';

const EventSearchController = {

    getEventSearchResults: (req, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + EVENT_API,
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

    getEventById: (eventId, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + EVENT_API + "/" + eventId,
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

module.exports = EventSearchController;