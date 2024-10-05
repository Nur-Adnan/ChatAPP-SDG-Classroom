require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const server = http.createServer(app);

// Define CORS options
const corsOptions = {
  origin: ["https://chat-app-sdg-classroom.vercel.app"], // Specify the client URL
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true, // Allow cookies and authentication
};

app.use(cors(corsOptions)); // Apply CORS middleware to express

// Instantiate Socket.IO with CORS options
const io = new Server(server, {
  cors: corsOptions,
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("send_prompt", async (prompt) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([{ text: prompt }]);
      if (result && result.response && result.response.text) {
        socket.emit("prompt_response", result.response.text());
      } else {
        socket.emit("error", "No response from AI model");
      }
    } catch (error) {
      socket.emit("error", "Error processing your request");
      console.error("Error when calling Google Generative AI:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// HTTP POST endpoint as fallback or additional option
app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([{ text: prompt }]);
    if (result && result.response && result.response.text) {
      res.json({ response: result.response.text() });
    } else {
      res.status(404).json({ error: "No response from AI model" });
    }
  } catch (error) {
    console.error("Error when calling Google Generative AI:", error);
    res.status(500).send("Error processing your request");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
