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
      store: {
        message: 'Store Name',
        required: true,
      },
    }
  }

  // get values
  const { store } = await prompt.get(schema);

  // get store directory
  const directory = `./src/stores`;

  // create Default.svelte
  await fs.writeFileSync(`${directory}/${store}.js`, contents.store);

  // read store index.js
  let storeIndex = fs.readFileSync('./src/stores/index.js', 'utf8');

  // split stores
  storeIndex = storeIndex.split('\n');

  // add new store
  storeIndex.push(`export { default as ${store} } from './${store}.js';`);

  // sort stores
  storeIndex = storeIndex.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  // update store index.js contents
  fs.writeFileSync('./src/stores/index.js', storeIndex.join('\n'));
})();