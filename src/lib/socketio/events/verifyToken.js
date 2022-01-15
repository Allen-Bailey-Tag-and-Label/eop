// imports
import mongodb from 'mongodb'
import { connect } from '../../db/index.js';
import { sign, verify } from '../../jwt/index.js';

const { ObjectId } = mongodb;

export default (io, socket) => {
  socket.on('verifyToken', async ({ token }, callback) => {
    console.log('socket.io - verifyToken');

    // connect to db
    const client = await connect();

    try {
      // verify token
      const _id = await verify(token);

      // find _id in db
      const user = await client.db().collection('users').findOne({ _id: ObjectId(_id) });

      // error if user is null
      if (user === null) throw 'Could not verify user.'

      // update token
      token = await sign(_id)

      callback({ token })
    } catch (error) {
      callback({ error })
    }
  })
}