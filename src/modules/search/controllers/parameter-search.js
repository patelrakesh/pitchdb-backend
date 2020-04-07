/* eslint-disable linebreak-style */
const axios = require('axios');

const PARAMETERS_API = '/parameters/public/';

const ParameterSearchController = {

    getSearchParameters: (req, type, callback) => {
        let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
        
        axios.get(process.env.MARKETING_SEARCH_URL + PARAMETERS_API + type,
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

module.exports = ParameterSearchController;