const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Conéctate a MongoDB
mongoose.connect("mongodb+srv://jamesronderoa02:vmm7f3i1OoOHPxn3@reserva.s5okro4.mongodb.net/?retryWrites=true&w=majority&appName=reserva", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"));
db.once("open", () => {
  console.log("Conectado a MongoDB");
});

// Definir un modelo para los mensajes
const messageSchema = new mongoose.Schema({
  username: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

app.route("/").get((req, res) => {
  res.json("¡Hola! Bienvenido de nuevo al canal Dev Stack 👋👋👋");
});

io.on("connection", (socket) => {
  socket.join("anonymous_group");
  console.log("Conexión al backend establecida");

  // Enviar mensajes guardados al cliente cuando se conecta
  Message.find({}, (err, messages) => {
    if (err) throw err;
    socket.emit("loadMessages", messages);
  });

  socket.on("sendMsg", (msg) => {
    console.log("msg", msg);

    // Guardar el mensaje en MongoDB
    const newMessage = new Message({
      username: msg.username,
      content: msg.content,
    });

    newMessage.save((err) => {
      if (err) throw err;
      // Emitir el mensaje a todos los clientes
      io.to("anonymous_group").emit("sendMsgServer", {
        ...msg,
        type: "otherMsg",
      });
    });
  });

  // Manejar la eliminación de la conversación
  socket.on("deleteConversation", () => {
    Message.deleteMany({}, (err) => {
      if (err) throw err;
      console.log("Conversación eliminada");
      // Emitir evento para actualizar la interfaz del cliente
      io.to("anonymous_group").emit("conversationDeleted");
    });
  });
});

httpServer.listen(3000, () => {
  console.log("El servidor está ejecutándose en el puerto 3000");
});
