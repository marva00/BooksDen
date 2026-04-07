const express = require('express');
const { createAOrder, getOrderByEmail, getOrderByUserId } = require('./order.controller');
const { verifyUserToken } = require('../middleware/verifyUserToken');

const router =  express.Router();

// create order endpoint
router.post("/", verifyUserToken, createAOrder);

// get orders by user email 
router.get("/email/:email", verifyUserToken, getOrderByEmail);
router.get("/user/:userId", verifyUserToken, getOrderByUserId);

module.exports = router;