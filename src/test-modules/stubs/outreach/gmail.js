module.exports = {
  checkTokenValidity: (emailAccount, callback) => {
    const DUMMY_TOKEN = '123ABC'
    callback(null, { token: DUMMY_TOKEN, email: emailAccount.email });
  },
  sendEmail: (emailData, token, callback) => {
    callback(null, {
      "id": "112345678",
      "threadId": "9876543",
      "labelIds": [
        "SENT"
      ]
    })
  }
}