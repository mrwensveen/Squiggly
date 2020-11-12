const server = require("socket.io")(8081, {
  cors: { origins: '*' }
});

server.use((socket, next) => {
  if (socket.handshake.query.room) return next();
  next(new Error('No room specified.'));
});

server.on("connection", socket => {
  console.log("user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  const query = socket.handshake.query;
  console.log(query);

  if (query.room) {
    console.log("joining room " + query.room);
    socket.join(query.room);

    // Current clients in the room
    server.to(query.room).allSockets().then(clients => {
      // Ready, player 0 (zero-indexed)
      socket.emit('welcome', clients.size - 1);
      console.log(clients);
    });
  }

  // Relay the following events
  ["announce", "step"].forEach(event => {
    socket.on(event, data => {
      broadcast(socket, event, data);
    });
  });
});

function broadcast(socket, event, data) {
    // Broadcast the event to everyone in the room (except the sending socket)
    socket.rooms.forEach(room => {
    if (room !== socket.id) {
      socket.broadcast.volatile.to(room).emit(event, data);
    }
  });
}
