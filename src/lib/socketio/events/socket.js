import 'dotenv/config';

export default (io, socket) => {
  if (process.env.NODE_ENV !== 'production')
    console.log(`socket.io - socket.id \`${socket.id}\` connected`);

  socket.on('db.create.doc', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.create.doc');
    io.emit('db.create.doc', { collection, doc });
  });
  socket.on('db.remove.doc', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.remove.doc');
    io.emit('db.remove.doc', { collection, doc });
  });
  socket.on('db.update.doc', function ({ collection, doc }, callback) {
    if (process.env.NODE_ENV !== 'production') console.log('socket.io - db.update.doc');
    io.emit('db.update.doc', { collection, doc });
  });
};
