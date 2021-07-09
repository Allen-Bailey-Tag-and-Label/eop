import { MongoClient } from 'mongodb';

// connection URI
const uri = 'mongodb+srv://bobmcaleavey:Superma3+@cluster0.0f8ym.mongodb.net/development?retryWrites=true&w=majority';

// connection options
const options = { useUnifiedTopology: true }

// create a new MongoClient
const client = new MongoClient(uri, options);

// initial connection variable
let connection;

// create connection function
const connect = async() => {
  if ( connection === undefined ) connection = await client.connect();
  return client;
}

export { connect };