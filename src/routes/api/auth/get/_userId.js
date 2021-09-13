import jwt from 'jsonwebtoken';
import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export default async body => {
  // destructure body
  const { auth: accessToken } = body;

  // decode token
  const decoded = jwt.verify(accessToken, import.meta.env.VITE_JWT_SECRET);

  // destructure token
  let { _id: userId } = decoded;
  userId = ObjectId(userId);

  // delete auth
  delete body.auth;

  // add userId to body
  body.userId = userId;

  return body;
};