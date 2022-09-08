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

const create = async (params) => {
  // connect to db
  const client = await connect();

  // default parameters
  const defaultParams = {
    collection: '',
    insert: {},
    options: {}
  };

  // merge params and destructure
  const { collection, insert, options } = Object.assign(defaultParams, params);

  // perform insert
  await client.db().collection(collection).insertOne(insert, options);
};

const find = async (params) => {
  // connect to db
  const client = await connect();

  // default parameters
  const defaultParams = {
    collection: '',
    options: {},
    query: {}
  };

  // merge params and destructure
  const { collection, query, options } = Object.assign(defaultParams, params);

  // find docs
  const docs = await client.db().collection(collection).find(query, options).toArray();

  return docs;
};

const remove = async (params) => {
  // connect to db
  const client = await connect();

  // default parameters
  const defaultParams = {
    collection: '',
    query: {},
    options: {}
  };

  // merge params and destructure
  const { collection, query, options } = Object.assign(defaultParams, params);

  // perform deletion
  await client.db().collection(collection).deleteMany(query, options);
};

const update = async (params) => {
  // connect to db
  const client = await connect();

  // default parameters
  const defaultParams = {
    collection: '',
    query: {},
    options: {},
    update: {}
  };

  // merge params and destructure
  const { collection, query, options, update } = Object.assign(defaultParams, params);

  // perform update
  await client.db().collection(collection).updateMany(query, update, options);
};

export { create, find, remove, update };
