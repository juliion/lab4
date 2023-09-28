const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

const connectedUsers = {};

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    do {
      color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
    } while (isColorReadable(color, '#ffffff')); 
    return color;
  }
  
  function isColorReadable(foregroundColor, backgroundColor) {
    const fgColor = parseInt(foregroundColor.slice(1), 16);
    const bgColor = parseInt(backgroundColor.slice(1), 16);
  
    const fgR = (fgColor >> 16) & 0xff;
    const fgG = (fgColor >> 8) & 0xff;
    const fgB = fgColor & 0xff;
  
    const bgR = (bgColor >> 16) & 0xff;
    const bgG = (bgColor >> 8) & 0xff;
    const bgB = bgColor & 0xff;
  
    const brightnessFg = (299 * fgR + 587 * fgG + 114 * fgB) / 1000;
    const brightnessBg = (299 * bgR + 587 * bgG + 114 * bgB) / 1000;
  
    const contrast = Math.abs(brightnessFg - brightnessBg);
  
    return contrast >= 125; 
}

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    if (socket.username) {
      delete connectedUsers[socket.username];
      io.emit('chat message', { username: 'Unfortunately', message: `${socket.username} has left the chat.`, color: '#6e0905' });
    }
  });

  socket.on('register', (username) => {
    if (!connectedUsers[username]) {
      socket.username = username;
      connectedUsers[username] = {
        socketId: socket.id,
        color: getRandomColor(), 
      };
      socket.emit('chatReady');
      io.emit('chat message', { username: 'Congratulations', message: `${username} has joined the chat.`, color: '#007bff'});
      socket.emit('chatReady');
    } else {
        socket.emit('registrationError', 'Username is already taken. Please choose a different one.');
    }
  });

  socket.on('chat message', (message) => {
    const userColor = connectedUsers[socket.username].color;
    if (socket.username) {
      io.emit('chat message',  {
        username: socket.username,
        message: message,
        color: userColor,
      });
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
