// imports
import bcrypt from 'bcryptjs';
import { connect } from '../../db/index.js';
import { sign } from '../../jwt/index.js';

export default (io, socket) => {
  socket.on('signin', async ({ password, username }, callback) => {
    console.log(`socket.io - signin`);

    // connect to db
    const client = await connect();

    try {
      // find username in db
      const user = await client.db().collection('users').findOne({ username });

      // error if user is null
      if (user === null) throw 'Credentials could not be verified.'

      // compare password
      const compare = await bcrypt.compare(password, user.password);

      // error if password doesn't match
      if (!compare) throw 'Credentials could not be verified.'

      // deconstruct user
      const { _id } = user;

      // generate token
      const token = await sign(_id);

      callback({ token });
    } catch (error) {
      callback({ error })
    }
  });
}