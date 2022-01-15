// imports
import { connect } from '../../db/index.js';
import { verify } from '../../jwt/index.js';
import mongodbQueryMap from '../../utils/mongodbQueryMap.js';

export default (io, socket) => {
  socket.on('remove', async ({ collection, query, token }, callback) => {
    console.log(`socket.io - remove`);

    // connect to db
    const client = await connect();

    try {
      // verify user
      await verify(token);

      // update any ObjectIds
      query = mongodbQueryMap(query);

      // find all documents
      const docs = await client.db().collection(collection).find(query).toArray();

      // delete from collection
      await client.db().collection(collection).deleteMany(query);

      // emit to all clients
      io.emit('remove', ({ collection, docs }))

      callback({});
    } catch (error) {
      callback({ error })
    }
  });
}