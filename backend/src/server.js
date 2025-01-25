const express = require("express");
require("dotenv").config();
require("./config/dbConfig"); // Ensures DB connection initializes

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
