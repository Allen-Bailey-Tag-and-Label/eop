// imports
import fs from 'fs';
import prompt from 'prompt';
import * as contents from './contents.js';

(async () => {
  // initialize prompt
  prompt.start();

  // define schema
  const schema = {
    properties: {
      event: {
        message: 'Event Name',
        required: true,
      },
    }
  }

  // get values
  const { event } = await prompt.get(schema);

  // get event directory
  const directory = `./src/lib/socketio/events`;

  // create Default.svelte
  await fs.writeFileSync(`${directory}/${event}.js`, contents.event.replace(/\{\{event\}\}/g, event));

  // read event index.js
  let eventIndex = fs.readFileSync('./src/lib/socketio/events/index.js', 'utf8');

  // split events
  eventIndex = eventIndex.split('\n');

  // add new event
  eventIndex.push(`export { default as ${event} } from './${event}.js';`);

  // sort events
  eventIndex = eventIndex.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  // update event index.js contents
  fs.writeFileSync('./src/lib/socketio/events/index.js', eventIndex.join('\n'));
})();