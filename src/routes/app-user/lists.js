/* eslint-disable linebreak-style */
const router = require('express').Router();
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const listController = require('../../modules/lists/controllers/list');
const listItemController = require('../../modules/lists/controllers/list-item');
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/lists');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/', (req, res, next) => {
  listController.getUserLists(req, (err, lists) => {
    handleStandard(req, res, err, lists, next);
  });
});

router.get('/count', (req, res, next) => {
  listController.getUserListsCount(req, (err, lists) => {
    handleStandard(req, res, err, lists, next);
  });
});

router.get('/:id', (req, res, next) => {
  listController.getUserList(req.decoded, req.params.id, (err, list) => {
    handleStandard(req, res, err, list, next);
  });
});

router.post('/', (req, res, next) => {
  listController.createList(req.decoded, req.body, (err, list) => {
    handleStandard(req, res, err, list, next);
  });
});

router.put('/:id', (req, res, next) => {
  listController.updateList(req.decoded, req.params.id, req.body, (err, list) => {
    handleStandard(req, res, err, list, next);
  });
});

router.delete('/:id', (req, res, next) => {
  listController.deleteList(req.decoded, req.params.id, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.get('/:id/count-summary', (req, res, next) => {
  listItemController.countSummary(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.get('/:id/items', validations.getItemsById, (req, res, next) => {
  listItemController.get(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.post('/:id/items', validations.postItemsById, (req, res, next) => {
  listItemController.create(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.get('/:id/items/count', validations.geItemsByIdCount, (req, res, next) => {
  listItemController.count(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.delete('/:id/items', (req, res, next) => {
  listItemController.delete(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});

router.get('/:id/items/:listItemId/sequence', (req, res, next) => {
  listItemController.getSequence(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  });
});

router.put('/:id/items/:listItemId/sequence', (req, res, next) => {
  listItemController.setActiveSequence(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  });
});

router.put('/items/contact', (req, res, next) => {
  listItemController.connectContacts(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
});


module.exports = router;