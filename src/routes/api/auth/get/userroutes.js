import { connect } from '$lib/db';
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

export async function post({body}) {
  // connect to db
  const client = await connect();

  // destructure body
  let {accessToken} = body;

  // decode token
  const decoded = jwt.verify(accessToken, import.meta.env.VITE_JWT_SECRET);

  // destructure token
  let { _id } = decoded;
  _id = ObjectId(_id);

  // find user
  const user = await client
    .db()
    .collection('users')
    .findOne({_id})

  // destructure user
  const { roles } = user;

  // initiate routes and rute
  let routes = [];
  const routeHash = {};

  // loop through roles for all routes
  await Promise.all(roles.map(async name=>{
    // find role
    const role = await client
      .db()
      .collection('roles')
      .findOne({name})
    
    // destructure role
    const { routes : roleRoutes } = role;

    // check if routes exist in routeHash
    roleRoutes.forEach(route => {
      if ( !(route._id in routeHash) ) {
        routeHash[route._id] = true;
        delete route._id;
        routes.push(route);
      }
    })
  }))

  return {
    status: 200,
    body: {routes}
  }
}