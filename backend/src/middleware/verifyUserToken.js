const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const verifyUserToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid credentials." });
  }
};

const optionalUserToken = (req, _res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    const user = jwt.verify(token, jwtSecret);
    req.user = user;
  } catch {
    req.user = null;
  }
  return next();
};

module.exports = {
  verifyUserToken,
  optionalUserToken,
};
