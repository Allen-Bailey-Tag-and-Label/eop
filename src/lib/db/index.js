import 'dotenv/config';
import * as adapters from './adapters';

const db = adapters[process.env.DB_ADAPTER];

export default db;
