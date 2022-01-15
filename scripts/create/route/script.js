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
      route: {
        message: 'route Name',
        required: true,
      },
    }
  }

  // get values
  const { route: path } = await prompt.get(schema);

  // get directory
  let directory = `./src/routes`;

  // loop through directories
  path.split('/').forEach(folder => {
    // update directory
    directory = `${directory}/${folder}`;

    // make folder if it doesn't exist
    if (!fs.existsSync(directory)) fs.mkdirSync(directory);
  });

  // create index.svelte
  await fs.writeFileSync(`${directory}/index.svelte`, contents.index);
})();