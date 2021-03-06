const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const {
  INSERT_USER_QUERY,
  GET_SINGLE_USER_QUERY,
  GET_USERS_QUERY,
  GET_FEED_QUERY,
  GET_FAVOURITE_MOVIES_QUERY,
} = require("../constants/queries");
const { populateMovies } = require("../utils/movieHelpers");
const { extractUniqueUsers } = require("../utils/userHelpers");

const router = express.Router();

router.get("/users", async (req, res) => {
  const { rows: feed } = await db.query(GET_FEED_QUERY);
  const users = extractUniqueUsers(feed);

  const feedPromises = users.map(async (user) => {
    const { rows } = await db.query(GET_FAVOURITE_MOVIES_QUERY, [user.userId]);
    const movies = await populateMovies(rows);
    return { movies, username: user.username };
  });

  const feedInfo = await Promise.all(feedPromises);
  res.send(feedInfo);
});

router.post("/users/login", async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await db.query(GET_SINGLE_USER_QUERY, [username]);

  if (rows.length === 0) {
    res.status(404).send({ status: "error", text: "No account exists with that username" });
  }

  const { id, password: hash } = rows[0];
  const isValid = await bcrypt.compare(password, hash);

  if (isValid) {
    res.send({ id, username });
  } else {
    res.status(404).send({ status: "error", text: "Incorrect password" });
  }
});

router.post("/users", async (req, res) => {
  const { username, password } = req.body;
  const saltRounds = 10;

  const { rows } = await db.query(GET_SINGLE_USER_QUERY, [username]);
  if (rows.length !== 0) {
    res.status(409).send({
      status: "error",
      text: "Username is already taken",
    });
  }

  const hash = await bcrypt.hash(password, saltRounds);

  const { rows: userInfo } = await db.query(INSERT_USER_QUERY, [username, hash]);
  const { id, username: newUserName } = userInfo[0];
  res.send({ id, username: newUserName });
});

router.get("/users/:username", async (req, res) => {
  const { username } = req.params;

  const { rows } = await db.query(GET_USERS_QUERY, [username]);
  res.send(rows);
});

module.exports = router;
