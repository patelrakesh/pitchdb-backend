const Credential = require('../models/credential');
const mailUtil = require('../../common/util/mail');

const generator = require('generate-password');
const bcrypt = require('bcrypt');

const userCredentialsController = {

  sendUserPassword: (user, isNew, callback) => {
    const saltRounds = 10;
    let password = generator.generate({
      length: 10,
      numbers: true
    });

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) callback(err);
      else
        if (isNew) {
          let newCredential = new Credential({
            userId: user._id,
            password: hash
          })
          newCredential.save(err => {
            if (err) callback(err);
            else {
              userCredentialsController.sendPasswordMail(user, password, isNew, callback);
            }
          })
        }
        else
          Credential.findOneAndUpdate({ userId: user._id }, { password: hash }, err => {
            if (err) callback(err);
            else
              userCredentialsController.sendPasswordMail(user, password, isNew, callback);
          })
    });
  },
  sendPasswordMail: (user, password, isNew, callback) => {
    let link = process.env.FRONT_BASE_URL;
    let message = isNew ?
      `An account was created for you on PitchDB, to sign in,
            enter the following credentials in "Sign in with PitchDB's crdentials" section: <br><br>`
      :
      `Your account's password was reset, use the following credentials to sign in:<br><br>`;
    let changeMessage = `We strongly recommend changing your password or configuring an external sign in method in your account's configuration
    after you sign in using this password`;
    mailUtil.sendEmail({
      from: '"PitchDB Account" <admin@pitchdb.com>',
      to: user.email,
      subject: isNew ? "PitchDB account creation" : "PitchDB account password reset",
      html: message
        + `User: ` + user.email + "<br>"
        + `Password: ` + password + "<br>"
        + `<br><br>`
        + changeMessage
        + `<br><br>`
        + `<a href="` + link
        + `" style="text-decoration: none;
                width:10em;
                display:block;
                padding:1em;
                text-align:center;
                font-weight:bold;
                color:white;
                background-color:rgb(0, 26, 183);">
                Go to PitchDB
                </a>`
    }, callback);
  }
}

module.exports = userCredentialsController;