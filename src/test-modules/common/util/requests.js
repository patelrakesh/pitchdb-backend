module.exports = {
    queryObjToString: queryObj => {
        let queryParams = "";
        for (var property in queryObj) {
            if (queryObj.hasOwnProperty(property)) {
                queryParams += ("&" + property + "=" + queryObj[property]);
            }
        }
        return queryParams.substring(1, queryParams.length);
    }
}