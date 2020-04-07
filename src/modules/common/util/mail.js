const nodemailer = require('nodemailer');

let smtpTransport = nodemailer.createTransport({
  host: 'smtp.ionos.com',
  port: 587,
  secure: false,
  auth: {
    user: 'admin@pitchdb.com',
    pass: process.env.IONOS_ACCOUNT_PASS
  }
})

const mailUtil = {

  sendEmail: (mailOptions, callback) => {
    mailOptions.generateTextFromHTML = true;
    smtpTransport.sendMail(mailOptions, callback);
  }
};

module.exports = mailUtil;