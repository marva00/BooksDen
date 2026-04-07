const express = require('express');
const { registerUser, loginUser, loginAdmin } = require('./user.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin', loginAdmin);

module.exports = router;