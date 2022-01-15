// imports
import { connect } from '../../db/index.js';
import { verify } from '../../jwt/index.js';

export default (io, socket) => {
  socket.on('authRoles', async ({ token }, callback) => {
    console.log(`socket.io - authRoles`);

    // connect to db
    const client = await connect();

    try {
      // verify user
      const _id = await verify(token);

      // find user
      const { roles } = await client.db().collection('users').findOne({ _id })

      callback({ roles })
    } catch (error) {
      callback({ error })
    }
  });
}