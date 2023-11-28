const { run, createTwitter } = require("./services/twitter.service");
const cors = require("cors");
const express = require("express");
const app = express();

app.use(express.json());
app.use(cors());

app.post("/twitter-fix", async (req, res) => {
  const user = await run();
  return res.status(200).json(user);
});

app.post("/create-twitter", async (req, res) => {
  const user = await createTwitter();
  return res.status(200).json(user);
});

app.listen(8080, () => {
  console.log("Twitter login run on port 8080");
});
// run();
