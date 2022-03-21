// imports
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handler } from './build/hander.js';
import { serverEvents, socketEvents } from './src/lib/socket-io/index.js';

// initiate app
const app = express();

// initiate server
const server = http.createServer(app);

// initiate io
const io = new Server(server);

// add serverEvents & socketEvents
serverEvents(io, socketEvents);

// add sveltekit middleware
app.use(handler);

// server listen
server.listen(process.env.PORT || 3000, () => {
  console.log(`Custom server listening on port ${process.env.PORT || 3000}`);
});
