/*
 * @see https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
 * @see https://groups.google.com/forum/#!topic/google-chrome-developer-tools/J0pQuKeeqfw
 */

const getDuration = pathToJson => {
  /* eslint-disable import/no-dynamic-require */
  /* eslint-disable global-require */
  const { traceEvents } = require(pathToJson);

  const firstEvtTs = traceEvents[0].ts;
  let lastEventWithTimestampIndex = traceEvents.length - 1;
  for (; lastEventWithTimestampIndex >= 0; lastEventWithTimestampIndex -= 1) {
    if (traceEvents[lastEventWithTimestampIndex].ts) break;
  }

  const lastEvtTs = traceEvents[lastEventWithTimestampIndex].ts;

  return (lastEvtTs - firstEvtTs) / (1000 * 1000);
};

/* eslint-disable no-console */
console.log(
  'first column of nodes:',
  getDuration('./tracing-results/adding_first_nodes.json')
);
console.log(
  'last column of nodes:',
  getDuration('./tracing-results/adding_last_nodes.json')
);
console.log(
  'linking last nodes:',
  getDuration('./tracing-results/linking_last_nodes.json')
);
