const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = new Server(server);

// Set up EJS as the template engine
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse JSON bodies
app.use(express.json());

// Define a route to render the index view
app.get("/", (req, res) => {
  res.render("index");
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("send-location", (data) => {
    io.emit("recieved-location", { id: socket.id, ...data });
  });

  socket.on("disconnect-user", () => {
    socket.emit("disconnected",socket.id);
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = 3000;

// Start the HTTP server with Socket.io
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
