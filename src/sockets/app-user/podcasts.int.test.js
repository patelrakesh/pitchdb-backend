/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const ioClient = require('socket.io-client');

const podcastEvents = require('../../modules/podcasts/constants/podcast-events');
const interceptorEvents = require('../../modules/common/interceptors/constants/socket-interceptor');

const requestsUtil = require('../../test-modules/common/util/requests');
const podcastsStubs = require('../../test-modules/stubs/podcasts');
const staging = require('../../test-modules/common/util/staging');

const Podcast = require('../../modules/podcasts/models/podcast');
const PodcastEpisode = require('../../modules/podcasts/models/podcast-episode');

const socketUrl = "http://localhost:8080/so-podcasts";

let podcastsSearchController = require('../../modules/podcasts/controllers/podcast-search');

const server = require('../../app')
before(function (done) {
  this.timeout(60000);
  if (server.get('status') !== 'started')
    server.on("app_started", () => {
      done()
    })
  else
    done()
})

describe("Podcasts search (sockets) integration tests", function () {
  describe("/so-podcasts", function () {

    this.timeout(150000);

    after((done) => {
      staging.deleteDocuments(['podcast', 'podcastEpisode', 'podcastReview'])
        .then(() => {
          done()
        });
    })


    it("Should find podcasts results given valid parameters", done => {

      const queryParameters = {
        type: 'podcast',
        keywords: 'software_developer',
        language: 'English',
        genreIds: '163_93',
        publishedAfter: '1477890000000',
        publishedBefore: '1552021200000',
        podcastSearch: 'Podcasts',
        pagination: 'false'
      }

      // Stub searchListenNotesAPI method so the call to the listennotes API is not made
      sinon.stub(podcastsSearchController, 'searchListenNotesAPI').callsFake(podcastsStubs.searchListenNotesAPI);

      // Initiate communication with sockets
      let socket = ioClient(socketUrl + "?" + requestsUtil.queryObjToString(queryParameters), { reconnectionAttempts: 3 });
      socket.emit("jwt-authentication", "Bearer " + process.env.TEST_JWT);

      socket.on(podcastEvents.RESULTS_FIRST, searcRresults => {

        expect(searcRresults).to.exist;
        expect(searcRresults.total).to.equal(21);

        expect(searcRresults.results).to.exist;
        expect(searcRresults.results.length).to.be.greaterThan(0);

        let haveTitle = true;
        let haveiTunesId = true;
        let haveListenNotesId = true;
        let haveTypePodcast = true

        for (let i = 0; i < searcRresults.results.length; i++) {
          const podcast = searcRresults.results[i];
          if (!podcast.title) haveTitle = false;
          if (!podcast.iTunesId) haveiTunesId = false;
          if (!podcast.listenNotesId) haveListenNotesId = false;
          if (podcast.type !== 'podcast') haveTypePodcast = false;

          socket.emit(podcastEvents.ITUNES_DATA, {
            index: i
          });

        }

        expect(haveTitle).to.be.true;
        expect(haveiTunesId).to.be.true;
        expect(haveListenNotesId).to.be.true;
        expect(haveTypePodcast).to.be.true;

      });

      socket.on(podcastEvents.RESULT_COMPLETE, ({ iTunesId }) => {
        Podcast.findOne({ iTunesId: iTunesId }, (err, podcast) => {
          if (err) console.log(err)
          expect(err).to.not.exist;
          expect(podcast).to.exist;
          expect(podcast).to.have.property('rating');

          PodcastEpisode.find({ podcast: podcast._id }, (err, episodes) => {
            expect(err).to.not.exist;
            expect(episodes).to.exist;
          })
        })
      })
      socket.on(podcastEvents.RESULT_ERROR, iTunesId => {
        expect.fail("A RESULT_ERROR event was thrown", "It should not throw an error", "Podcast failed: " + iTunesId);
      })
      socket.on(podcastEvents.RESULTS_COMPLETE, () => {
        Podcast.find({}, (err, podcasts) => {
          expect(err).to.not.exist;
          expect(podcasts).to.exist;
          expect(podcasts.length).to.equal(10);
          done();
        })
      })
      socket.on(podcastEvents.SEARCH_ERROR, error => {
        expect.fail("A SEARCH_ERROR event was thrown", "It should not throw an error", error);
        done();
      })
      socket.on(interceptorEvents.INVALID_JWT, error => {
        expect.fail("A INVALID_JWT event was thrown", "It should not throw an error", error)
        done();
      })
    })
  })
})