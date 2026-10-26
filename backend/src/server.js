
const express = require("express");
require("dotenv").config();

const app = express();


app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running"
  });
});

app.post("/api/echo", (req, res) => {
  console.log("Received echo:", req.body);
  res.json({
    status: "ok",
    message: "Echo received",
    data: req.body
  });
  
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
