const router = require('express').Router();
const userController = require('../../modules/users/controllers/user');
const handleStandard = require("../../modules/common/util/handle-standard");

router.post('/', (req, res, next) => {
   userController.createFromWebHook(req.body, (err) => {
        handleStandard(req,res, err, null, next);
   })
});

module.exports = router;