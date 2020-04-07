const axios = require('axios');
const mailConstants = require('../constants/mail');
const winston = require('winston');

const gmailController = {

  // For reference view the specification https://tools.ietf.org/html/rfc2822#appendix-A.1
  buildRfc2822Base64: emailData => {
    let message = "From: ";
    message += '"' + emailData.senderName + '" ';
    message += "<" + emailData.from + ">\r\n";
    message += "To: ";
    message += (process.env.NODE_ENV === 'production' ? emailData.to : "sbeltrancaicedo@gmail.com") + "\r\n";
    //ronstoryjr@gmail.com
    message += "Subject: ";
    message += emailData.subject + "\r\n";
    message += "Content-type: text/html" + "\r\n\r\n";
    message += emailData.message + "\r\n";

    // Insert invisible gif into email that will trigger the 'opens' endpoint whenever the user opens the email
    message += '<img src="' + process.env.BACK_BASE_URL + '/opens/outreach-sequence/' + emailData.openId + '.gif" alt="image">'
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },

  getConversation: (content, token, callback) => {
    const requestUrl = mailConstants.GOOGLE_BASE_URL + "users/me/threads/" + content.emailData.threadId;
    const authString = 'Bearer ' + token;
    axios.get(requestUrl, { headers: { Authorization: authString } })
      .then(response => {
        callback(null, response.data);
      })
      .catch(error => {
        winston.warn(error.response ? error.response.data : error);
        callback(error.response ? error.response.data : error);
      })
  },

  /*
  * 
  */
  checkPayloadForReply: (thread, currentThread) => {
    let reply;
    // If the amount of messages in the retrieved thread is greater than the messages count stored in the database, then that means
    // there is a new message
    const messages = thread.messages;
    if (currentThread < messages.length) {
      const message = messages[currentThread];
      reply = {
        message: getMessageFromPayload(message.payload),
        date: new Date(Number(message.internalDate)),
        id: message.id,
        threadId: message.threadId,
        snippet: message.snippet
      };
      message.payload.headers.forEach(header => {
        let emailStartIndex = 0;
        let emailEndIndex = 0;
        switch (header.name) {
          case 'From':
            // According to the specification, the email address is surronded by <>
            emailStartIndex = header.value.indexOf("<");
            emailEndIndex = header.value.lastIndexOf(">");
            if (emailStartIndex !== -1 && emailEndIndex !== -1)
              reply.from = header.value.substring(emailStartIndex + 1, emailEndIndex);
            break;
          case 'Subject':
            reply.subject = header.value;
            break;
          default:
            break;
        }
      });
    }
    return reply;
  }
}

const getMessageFromPayload = payload => {
  let message;
  const mimeType = payload.mimeType;
  if (mimeType !== 'text/plain') {
    payload.parts.forEach(part => {
      if (!message && part.mimeType === 'text/plain')
        message = Buffer.from(part.body.data, 'base64').toString('ascii');
    });
  }
  else {
    message = Buffer.from(payload.body.data, 'base64').toString('ascii');
  }
  return message ? parseGmailMessage(message) : message;
}

const parseGmailMessage = message => {
  const responseIndex = message.indexOf("wrote:\r\n\r\n>");
  const almostCleanMessage = message.substring(0, responseIndex);
  const cleanMessage = almostCleanMessage.substring(0, almostCleanMessage.lastIndexOf("\r\n\r\nOn"));
  return cleanMessage;
}

module.exports = gmailController;