const Stage = require('../../outreach/models/stage');
const LatestStage = require('../../outreach/models/latest-stage');
const commonChartConstants = require('../constants/common');
const errorConstants = require('../../common/errors/constants');
const CustomError = require('../../common/errors/custom-error');
const mongoose = require('mongoose');

let ObjectId = mongoose.Types.ObjectId;

const stagesChartController = {
  getSummary: (req, callback) => {
    let firstQuery = {};

    if (req.decoded.teamId)
      firstQuery.teamId = ObjectId(req.decoded.teamId);
    else
      firstQuery.userId = ObjectId(req.decoded.userId);

    if (req.query.dateStart)
      firstQuery.date = { $gte: new Date(req.query.dateStart + commonChartConstants.DATE_ZERO_TIME) };

    if (req.query.dateTo)
      if (firstQuery.date)
        firstQuery.date.$lte = new Date(req.query.dateTo + commonChartConstants.DATE_FINAL_TIME);
      else
        firstQuery.date = { $lte: new Date(req.query.dateTo + commonChartConstants.DATE_FINAL_TIME) };

    const initialMapReduceObject = {
      map: function () {
        emit(this.sequence, this); // eslint-disable-line no-undef
      },
      reduce: function (key, values) {
        let latestStage = values[0];
        for (let i = 0; i < values.length; i++) {
          let actualStage = values[i];
          if (actualStage.date > latestStage.date) {
            latestStage = actualStage;
          }
        }
        return latestStage;
      },
      query: firstQuery,
      out: { merge: "latest_stages" },
    }

    Stage.mapReduce(initialMapReduceObject, (err) => {
      if (err) callback(err);
      else {

        let secondQuery = {};
        if (req.decoded.teamId)
          secondQuery['value.teamId'] = ObjectId(req.decoded.teamId);
        else
          secondQuery['value.userId'] = ObjectId(req.decoded.userId);

        if (req.query.dateStart)
          secondQuery['value.date'] = { $gte: new Date(req.query.dateStart + commonChartConstants.DATE_ZERO_TIME) };

        if (req.query.dateTo)
          if (secondQuery['value.date'])
            secondQuery['value.date'].$lte = new Date(req.query.dateTo + commonChartConstants.DATE_FINAL_TIME);
          else
            secondQuery['value.date'] = { $lte: new Date(req.query.dateTo + commonChartConstants.DATE_FINAL_TIME) };


        const mapReduceObject = {
          map: function () {
            emit(this.value.category, 1); // eslint-disable-line no-undef
          },
          reduce: function (key, values) {
            return Array.sum(values);
          },
          query: secondQuery
        }

        LatestStage.mapReduce(mapReduceObject, (err, result) => {
          if (err) callback(err);
          else
            callback(null, result.results);
        })

      }
    })

  },

  getAmount: (req, callback) => {

    let query = {};

    let map;
    switch (req.query.period) {
      case commonChartConstants.PERIOD_DAILY:
        map = function () {

          emit({ // eslint-disable-line no-undef
            date: this.date.getDate(), // eslint-disable-line no-invalid-this
            month: this.date.getMonth() + 1, // eslint-disable-line no-invalid-this
            category: this.category // eslint-disable-line no-invalid-this
          }, 1);
        }
        query.date = {
          $gte: new Date(req.query.dateStart + commonChartConstants.DATE_ZERO_TIME),
          $lte: new Date(req.query.dateTo + commonChartConstants.DATE_FINAL_TIME)
        }
        break;
      default:
        callback(new CustomError('Invalid period', errorConstants.STATUS_BAD_REQUEST));
        return;
    }

    if (req.decoded.teamId)
      query.teamId = req.decoded.teamId;
    else
      query.userId = req.decoded.userId;

    const mapReduceObject = {
      map,
      reduce: function (key, values) {
        return Array.sum(values);
      },
      query: query
    }
    Stage.mapReduce(mapReduceObject, (err, result) => {
      if (err) callback(err);
      else
        callback(null, result.results);
    })
  }
}

module.exports = stagesChartController;