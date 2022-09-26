import cors from 'cors';
import express from 'express';
import { createServer } from 'http';

import { handler } from '../build/handler.js';
import injectSocketIO from '../src/lib/socketio/injectSocketIO.js'; // The SocketIO stuff (see next step)

const port = 3000;
const app = express();
app.use(cors());
app.use(handler);

const server = createServer(app);

injectSocketIO(server);

server.listen(port);
