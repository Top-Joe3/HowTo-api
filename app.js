const express = require("express");
const app = express();
const path = require("node:path");
require("dotenv").config();
const router = require("./routes/router");
const cors = require("cors");

app.set("trust proxy", 1);

const allowedOrigins = process.env.CLIENT_URLS.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", router);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Express app listening on port ${PORT}`);
});
