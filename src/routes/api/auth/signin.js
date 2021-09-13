import { connect } from '$lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function post({body}) {
  // connect to db
  const client = await connect();

  // destructure body
  let {username, password} = body;
  username = username.toLowerCase().replace(/\s/g, '')

  // find username on database
  const user = await client.db().collection('users').findOne({username})

  // return error if couldn't find user
  if ( user === null) {
    return { 
      status: 403,
      body: {
        error: 'Creditials could not be verified.  Please try again'
      }
    }
  }

  // compare password
  const compare = await bcrypt.compare(password, user.password);

  if ( !compare ) {
    return { 
      status: 403,
      body: {
        error: 'Creditials could not be verified.  Please try again'
      }
    }
  } else {
    // destructure user
    const { _id } = user;

    // sign accessToken
    const accessToken = jwt.sign({_id}, import.meta.env.VITE_JWT_SECRET)

    return {
      status: 200,
      body: { accessToken }
    }
  }
}