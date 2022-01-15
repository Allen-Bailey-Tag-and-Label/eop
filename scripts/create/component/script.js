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
      component: {
        message: 'Component Name',
        required: true,
      },
    }
  }

  // get values
  const { component } = await prompt.get(schema);

  // get component directory
  const directory = `./src/components/${component}`;

  // check if folder already exists
  if (fs.existsSync(directory)) return console.log(`Directory already exists`);

  // create folder
  fs.mkdirSync(directory);

  // create Default.svelte
  await fs.writeFileSync(`${directory}/Default.svelte`, contents.default);

  // create index.js
  await fs.writeFileSync(`${directory}/index.js`, contents.js);

  // read component index.js
  let componentIndex = fs.readFileSync('./src/components/index.js', 'utf8');

  // split components
  componentIndex = componentIndex.split('\n');

  // add new component
  componentIndex.push(`export { default as ${component} } from './${component}';`);

  // sort components
  componentIndex = componentIndex.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  // update component index.js contents
  fs.writeFileSync('./src/components/index.js', componentIndex.join('\n'));
})();