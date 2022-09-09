import { Server } from 'socket.io';
import listeners from './listeners';

export default {
  name: 'sveltekit-socket.io',
  configureServer(server) {
    const io = new Server(server.httpServer);

    listeners(io);

    console.log('SocketIO injected');
  }
};
