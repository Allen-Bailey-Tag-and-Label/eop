// imports
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from './build/handler.js';
import { serverEvents, socketEvents } from './src/lib/socket-io/index.js';

// initite PORT
const port = process.env.PORT || 3000;

// initiate app
const app = express();

// initiate server
const server = createServer(app);

// initiate io
const io = new Server(server)(port);

// add serverEvents & socketEvents
serverEvents(io, socketEvents);

// add sveltekit middleware
app.use(handler);

// server listen
server.listen(port, () => {
  console.log(`Custom server listening on port ${port}`);
});
