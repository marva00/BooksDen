const express = require("express");
const { getAllNews } = require("./news.controller");

const router = express.Router();

router.get("/", getAllNews);

module.exports = router;
