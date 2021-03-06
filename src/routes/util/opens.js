const router = require('express').Router();
const openController = require('../../modules/outreach/controllers/open');

router.get('/outreach-sequence/:id.gif', (req, res) => {
    const buf = new Buffer([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
        0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x2c,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02,
        0x02, 0x44, 0x01, 0x00, 0x3b]);

    res.send(buf, { 'Content-Type': 'image/gif' }, 200);
    openController.updateEmailOpened(req.params.id);
});

module.exports = router;