const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 4000;

const rooms = {};
const socketToRoom = {};

app.use(express.static(path.resolve(__dirname, "./client/build")));

app.get("/api/rooms", (_, res) => {
  res.json(rooms);
});

app.use((_, res) => {
  res.sendFile(path.resolve(__dirname, "./client/build/index.html"));
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomID, name }) => {
    socket.join(roomID);

    if ((rooms[roomID]?.length ?? 0) >= 4) {
      socket.emit("room-full");
      return;
    }

    rooms[roomID] = rooms[roomID]
      ? [...rooms[roomID], { id: socket.id, name }]
      : [{ id: socket.id, name }];
    socketToRoom[socket.id] = roomID;

    const usersInRoom = rooms[roomID].filter(({ id }) => id !== socket.id);
    socket.emit("all-users", usersInRoom);
  });

  socket.on("media-update", ({ roomID, audioEnabled, videoEnabled }) => {
    rooms[roomID] &&
      io
        .to(
          rooms[roomID].map((user) => user.id).filter((id) => id !== socket.id)
        )
        .emit("peer-media-update", {
          audioEnabled,
          videoEnabled,
          peerID: socket.id,
        });
  });

  socket.on(
    "sending-signal",
    ({ signal, callerID, name, userToSignal, audioEnabled, videoEnabled }) => {
      io.to(userToSignal).emit("user-joined", {
        signal,
        callerID,
        name,
        audioEnabled,
        videoEnabled,
      });
    }
  );

  socket.on(
    "returning-signal",
    ({ signal, callerID, audioEnabled, videoEnabled }) => {
      io.to(callerID).emit("recieved-signal", {
        signal,
        id: socket.id,
        audioEnabled,
        videoEnabled,
      });
    }
  );

  socket.on("disconnect", () => {
    console.log("disconnected: ", socket.id);
    const roomID = socketToRoom[socket.id];
    const room = rooms[roomID];
    if (room) {
      rooms[roomID] = room.filter(({ id }) => id !== socket.id);
      io.in(roomID).emit("user-left", socket.id);
    }
  });
});

server.listen(port, () => console.log(`server is running on port ${port}`));
