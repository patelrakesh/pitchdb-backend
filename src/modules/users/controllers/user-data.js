const User = require('../models/user.js');

const userDataController = {
  getData: (req, res) => {
    User.findOne({ _id: req.decoded.userId }).exec((err, doc) => {
      if (err) res.status(500).send(err.message);
      else {
        if (doc) res.status(200).send(doc);
        else res.status(200).send("No user found with the provided credentials, please check your email and/or password");
      }
    });
  }
};

module.exports = userDataController;