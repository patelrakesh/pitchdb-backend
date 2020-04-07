const axios = require('axios');
const winston = require('winston');
const mailConstants = require('../constants/mail');
const jsdom = require("jsdom");
const moment = require('moment');
const async = require('async');
const { JSDOM } = jsdom;

const CustomError = require('../../common/errors/custom-error');

const outlookController = {
  buildMailBody: emailData => {
    return {
      message: {
        subject: emailData.subject,
        body: {
          contentType: 'html',
          content: emailData.message + "\r\n"
          // Insert invisible gif into email that will trigger the 'opens' endpoint whenever the user opens the email
            + '<img src="' + process.env.BACK_BASE_URL + '/opens/outreach-sequence/' + emailData.openId + '.gif" alt="image">'
        },
        toRecipients: [
          {
            emailAddress: {
              address: process.env.NODE_ENV === 'production' ? emailData.to : "sbeltrancaicedo@gmail.com"
            }
          }
        ]
      }
    }
  },

  /*
  * This method handles the necessary steps to get the data of an email sent using outlook.
  * At the time of writting, the microsoft API does not return the data necesarry to track an email
  * when it is sent.
  * In this method, the objective is to get the email from the user's sent emails folder using the known email data
  * like the recipient and the subject.
  */
  getSentMail: (emailData, emailAccount, callback) => {
    const authString = 'Bearer ' + emailAccount.emailToken;
    const toEmail = process.env.NODE_ENV === 'production' ? emailData.to : "sbeltrancaicedo@gmail.com";
    let requestUrl = mailConstants.MICROSOFT_BASE_URL + "mailFolders/SentItems/messages";
    requestUrl += `?$search="to:[${toEmail}]"`;
    // Stop attempting when the email is found or the API returns an error message
    async.retry(
      {
        times: 3,
        interval: 1500,
        errorFilter: err => {
          return err.message === 'No reply found';
        }
      }, next => {
        axios.get(requestUrl, { headers: { Authorization: authString } })
          .then(response => {
            if (response.data && response.data.value) {
              let email = outlookController.getEmailFromSentList(emailData, response.data.value);
              if (email) {
                next(null, {
                  emailData: {
                    id: email.id,
                    changeKey: email.changeKey,
                    internetMessageId: email.internetMessageId,
                    webLink: email.webLink,
                    threadId: email.conversationId
                  }
                })
              }
              else {
                next(new CustomError('No reply found', 500));
              }
            }
            else {
              next(new CustomError('No reply found', 500));
            }
          })
          .catch(error => {
            winston.warn(error.response ? error.response.data : error);
            next(error.response ? error.response.data : error);
          })
      }, callback);
  },

  /*
  * Get the first email which subject and recipient are the same as the subject and recipient in the outreach sequence stage.
  * The emails are sorted from newest to oldest
  */
  getEmailFromSentList: (emailData, list) => {
    let found;
    for (let i = 0; i < list.length && !found; i++) {
      const sentemail = list[i];
      const recipients = sentemail.toRecipients;
      if (process.env.NODE_ENV !== 'production' && sentemail.subject === emailData.subject)
        found = sentemail;

      if (recipients)
        for (let j = 0; j < recipients.length && !found; j++) {
          const recipient = recipients[j];
          if (recipient.emailAddress.address === emailData.to && sentemail.subject === emailData.subject)
            found = sentemail;
        }
    }
    return found;
  },

  /*
  * Get messages with the thread id, sorting by recieve date. The minimun date of the messages must be greater than 2 years
  */
  getConversation: (content, token, callback) => {
    let timeFilter = moment().subtract(2, 'years').format('YYYY-MM-DD');
    const requestUrl = mailConstants.MICROSOFT_BASE_URL + `messages?$orderby=receivedDateTime asc&$filter=receivedDateTime ge ${timeFilter}`
      + ` and conversationId eq '${content.emailData.threadId}'`;
    const authString = 'Bearer ' + token;
    axios.get(requestUrl, { headers: { Authorization: authString } })
      .then((response) => {
        callback(null, response.data.value);
      })
      .catch((error) => {
        winston.warn(error.response ? error.response.data : error);
        callback(error.response ? error.response.data : error);
      })
  },

  checkConversationForReply: (conversation, currentMessage) => {
    let reply;
    // If the amount of messages in the retrieved thread is greater than the messages count stored in the database, then that means
    // there is a new message
    if (currentMessage < conversation.length) {
      const message = conversation[currentMessage];
      reply = {
        message: getMesageFromHtml(message.body.content),
        date: new Date(message.receivedDateTime),
        id: message.id,
        threadId: message.conversationId,
        snippet: message.bodyPreview,
        subject: message.subject,
        from: message.from.emailAddress.address
      };
    }
    return reply;
  }
}


/*
* A message contains the entire thread of messages exchanged between the recipient and sender. This method aims to grab only
* the new email body contianed in the message
*/
const getMesageFromHtml = (htmlMessage) => {
  const completeDom = new JSDOM(htmlMessage);
  let firstDiv = completeDom.window.document.body.getElementsByTagName('div')[0];
  let finalDom = new JSDOM(`<body>${firstDiv.outerHTML}</body>`);

  return finalDom.serialize();
}

module.exports = outlookController;