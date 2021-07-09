import { connect } from '$lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function post({body}) {
  // connect to db
  const client = await connect();

  // destructure body
  let {email, password} = body;

  // find email on database
  const user = await client.db().collection('users').findOne({email})

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