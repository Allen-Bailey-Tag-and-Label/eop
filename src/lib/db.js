import mongodb from 'mongodb';
const { MongoClient } = mongodb

// connection options
const options = { useUnifiedTopology: true }

// create a new MongoClient
const client = {};

// initial connection variable
const connection = {};

// create connection function
const connect = async (db = import.meta.env?.VITE_MONGO_DB || 'development') => {
  if (!(db in client)) client[db] = new MongoClient(`mongodb+srv://bobmcaleavey:Superma3+@cluster0.0f8ym.mongodb.net/${db}?retryWrites=true&w=majority`, options);
  if (!(db in connection)) connection[db] = await client[db].connect();
  return client[db];
}

// close connection
const close = async (db = import.meta.env?.VITE_MONGO_DB || 'development') => client[db].close();

export { close, connect };