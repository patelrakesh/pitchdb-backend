const podcastsEvents = {
  // Server emitted events
  RESULTS_FIRST: "results-first",
  RESULT_COMPLETE: "result-percentage",
  RESULT_ERROR: "result-error",
  RESULTS_COMPLETE: "results-complete",
  SEARCH_ERROR: "search-error",

  // Client emitted events
  ITUNES_DATA: "itunes-data"
}

module.exports = podcastsEvents;