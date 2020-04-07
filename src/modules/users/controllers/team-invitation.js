const mailUtil = require('../../common/util/mail');

const jwt = require('jsonwebtoken');
const winston = require('winston');

const teamInvitationController = {
  issue: (team, destEmail, userName, callback) => {
    if (!team._id)
      callback("Error, no team id");
    else {
      let invitationJWT = jwt.sign({ teamId: team._id }, process.env.AUTHORITY_SPARK_TEAM_SECRET,
        {
          expiresIn: '1d',
          issuer: 'Authority-spark',
        });

      let host = process.env.FRONT_BASE_URL;

      const invitationLink = host + '/invitation?inv=' + invitationJWT;

      sendIssuedJWT(invitationLink, destEmail, userName, (err, data) => {
        if (err) {
          winston.error("There was an error sending the email with the issued JWT: " + err);
          callback(err);
        }
        else callback();
      })
    }
  },

  verifyToken: (token, callback) => {
    jwt.verify(token, process.env.AUTHORITY_SPARK_TEAM_SECRET, { issuer: 'Authority-spark' }, (err, decoded) => {
      if (err) {
        winston.error('Unauthorized: ' + err);
        callback(err);
      } else {
        callback(null, decoded.teamId);
      }
    })
  }
};

const sendIssuedJWT = (link, destEmail, userName, callback) => {

  mailUtil.sendEmail({
    from: '"PitchDB Account" <admin@pitchdb.com>',
    to: destEmail,
    subject: userName + " invited you on PitchDB",
    html: `To join ` + userName + `'s team on PitchDB spark, please create account using the following button: <br><br>`
      + `<a href="` + link + `" style="text-decoration: none;
          width:10em;
          display:block;
          padding:1em;
          text-align:center;
          font-weight:bold;
          color:white;
          background-color:rgb(0, 26, 183);">
          Join PitchDB
          </a>`
  }, callback);
}

module.exports = teamInvitationController;