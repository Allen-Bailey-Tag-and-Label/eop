// imports
import _dotenvConfig from 'dotenv/config';
import jwt from 'jsonwebtoken';

export default async _id => {
  // sign token
  const token = await jwt.sign({ _id }, import.meta.env?.JWT_SECRET || process.env.JWT_SECRET);

  return token
}