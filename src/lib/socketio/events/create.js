// imports
import { connect } from '../../db/index.js';
import { verify } from '../../jwt/index.js';

export default (io, socket) => {
  socket.on('create', async ({ collection, data, token }, callback) => {
    console.log(`socket.io - create`);

    // connect to db
    const client = await connect();

    try {
      // verify user
      await verify(token);

      // insert into collection
      const { value: doc } = await client.db().collection(collection).findOneAndUpdate(data, { $set: {} }, { upsert: true, returnDocument: 'after' });

      // emit to all clients
      io.emit('create', { collection, doc });

      callback({ doc })
    } catch (error) {
      callback({ error })
    }
  });
}