import 'dotenv/config';

export default (io, socket) => {
  if (process.env.NODE_ENV !== 'production')
    console.log(`socket.io - socket.id \`${socket.id}\` connected`);

  socket.on('db.create', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.create');
    io.emit('db.create', { collection, doc });
  });
  socket.on('db.remove', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.remove');
    io.emit('db.remove', { collection, doc });
  });
  socket.on('db.update', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.update');
    io.emit('db.update', { collection, doc });
  });
};
