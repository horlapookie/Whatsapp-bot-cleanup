import express from "express";
import basicAuth from "express-basic-auth";
import { exec } from "child_process";
import config from "./config.js";

const app = express();

app.use(
  basicAuth({
    users: { [config.username]: config.password },
    challenge: true,
  })
);

app.get("/", (req, res) => {
  res.send(`
    <h1>Bot Panel</h1>
    <a href="/start">Start Bot</a> |
    <a href="/stop">Stop Bot</a> |
    <a href="/restart">Restart Bot</a>
  `);
});

app.get("/start", (req, res) => {
  exec(`pm2 start ${config.botStartCommand}`, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr || err}</pre>`);
  });
});

app.get("/stop", (req, res) => {
  exec(`pm2 stop all`, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr || err}</pre>`);
  });
});

app.get("/restart", (req, res) => {
  exec(`pm2 restart all`, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr || err}</pre>`);
  });
});

app.listen(config.port, () => {
  console.log(`Panel running at http://localhost:${config.port}`);
});
