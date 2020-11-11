const io = require("socket.io");

const server = io.listen(8081);

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
    server.to(query.room).clients((error, clients) => {
      if (error) throw error;

      socket.emit('welcome', clients.length);
      console.log(clients);
    });
  }

  socket.on("p", data => {
    // Broadcast the event to everyone in the room (except the sending socket)
    Object.keys(socket.rooms).filter(room => room !== socket.id).forEach(room => {
      socket.volatile.to(room).emit("p", data);
    });
  });
});
