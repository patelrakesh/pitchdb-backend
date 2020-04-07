const https = require("https"),
    fs = require("fs");

module.exports = app => {
    let server;
    if (process.env.NODE_ENV === 'production') {
        const options = {
            cert: fs.readFileSync(process.env.CERT_FOLDER),
            key: fs.readFileSync(process.env.KEY_FOLDER)
        };
        server = https.createServer(options, app);
    }
    else
        server = require('http').Server(app);

    server.listen(process.env.PORT || 8080);
    return server;
}