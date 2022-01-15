// imports
import { connect } from '../../db/index.js';
import { verify } from '../../jwt/index.js';

export default (io, socket) => {
  socket.on('find', async ({ collection, options = {}, token, query = {} }, callback) => {
    console.log(`socket.io - find`);

    // connect to db
    const client = await connect();

    try {
      // verify user
      await verify(token);

      // find docs
      const docs = await client.db().collection(collection).find(query, options).toArray();

      callback({ docs });
    } catch (error) {
      callback({ error })
    }
  });
}