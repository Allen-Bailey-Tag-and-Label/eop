import 'dotenv/config';
import { MongoClient } from 'mongodb';

// connection options
const options = { useUnifiedTopology: true };

// initialize client and connection
let client, connection;

// close connection
const close = () => client.close();

// create connection
const connect = async () => {
  // check if client is undefined
  if (client === undefined) {
    client = new MongoClient(
      process.env.MONGODB_CONNECTION_STRING.replace(
        '<password>',
        process.env.MONGODB_PASSWORD
      ).replace('?retryWrites', `${process.env.MONGODB_DB}?retryWrites`)
    );
    connection = await client.connect();
  }
  return client;
};

export default connect;
export { close, connect };
