const io = require("socket.io");

const server = io.listen(8081);

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
  }

  socket.on("p", (data) => {
    //console.log("joined rooms", Object.keys(socket.rooms));

    // Broadcast the event to everyone in the room (except the sending socket)
    Object.keys(socket.rooms).filter(room => room !== socket.id).forEach(room => {
      socket.to(room).emit("p", data);
    });
  });
});
