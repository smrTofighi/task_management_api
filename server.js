require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const app = express();
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const taskRoutes = require("./routes/task-routes");
const reportRoutes = require("./routes/report-routes");

//! Middleware to handle CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//! Middleware
app.use(express.json());

//! Connect to DB
connectDB();

//? Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

//  Server uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//* Start the Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
