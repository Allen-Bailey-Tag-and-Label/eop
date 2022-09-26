import { Server } from 'socket.io';
import serverEvents from './events/server.js';
import socketEvents from './events/socket.js';

export default (server, options = {}) => {
  // initiate default options
  const defaults = { serverEvents, socketEvents };

  // merge defaults with options
  options = Object.assign(defaults, options);

  // create io server
  const io = new Server(server);

  // pass io server to serverEvents
  options.serverEvents(io, options.socketEvents);
};
