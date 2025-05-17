import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // your backend server URL

const socket = io(SOCKET_URL, {
  autoConnect: false, // connect manually when ready
});

export default socket;
