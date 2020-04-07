/* eslint-disable linebreak-style */
const router = require('express').Router();
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');

const teamController = require("../../modules/users/controllers/team");
const teamInvitationController = require("../../modules/users/controllers/team-invitation");

const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/teams');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

// Team

router.post('/', (req, res, next) => {
  teamController.create(req, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
});

router.post('/invitation', validations.postInvitation, (req, res, next) => {
  teamInvitationController.issue(req.body.team, req.body.email, req.decoded.name, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

router.get("/", (req, res, next) => {
  teamController.getTeamAndUsers(req.decoded.teamId, (err, team) => {
    handleStandard(req, res, err, team, next);
  })
})

router.delete("/users/:id", (req, res, next) => {
  teamController.removeTeamUser(req.decoded, req.params.id, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

module.exports = router;