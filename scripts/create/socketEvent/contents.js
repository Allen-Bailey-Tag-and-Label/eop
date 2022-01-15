export const event = `// imports
// import { connect } from '../../db/index.js';
// import { sign, verify } from '../../jwt/index.js';

export default(io, socket) => {
  socket.on('{{event}}', async ({  }, callback) => {
    console.log(\`socket.io - {{event}}\`);

    // connect to db
    const client = await connect();

    try {

    } catch (error) {
      callback({ error })
    }
  });
}`