/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const server = require('../../app')
before(done => {
  server.on("app_started", function () {
    done()
  })
})

describe("Outreach sequences management integration tests", function () {
  describe("POST /", function () {

  })
})