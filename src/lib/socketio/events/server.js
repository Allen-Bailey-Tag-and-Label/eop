export default (io, socketEvents) => {
  io.on('connection', (socket) => {
    'socket.io - connected';
    socketEvents(io, socket);
  });
};
