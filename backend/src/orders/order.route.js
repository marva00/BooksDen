const express = require('express');
const { createAOrder, getOrderByEmail, getOrderByUserId, getOrderTrackingById } = require('./order.controller');
const { verifyUserToken } = require('../middleware/verifyUserToken');

const router =  express.Router();

// create order endpoint
router.post("/", verifyUserToken, createAOrder);

// get orders by user email 
router.get("/email/:email", verifyUserToken, getOrderByEmail);
router.get("/user/:userId", verifyUserToken, getOrderByUserId);
router.get("/track/:orderId", verifyUserToken, getOrderTrackingById);

module.exports = router;