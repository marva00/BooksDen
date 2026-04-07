const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  "bc992a20cb6706f741433686be814e3df45e57ea1c2fc85f9dbb0ef7df12308a669bfa7c976368ff32e32f6541480ce9ec1b122242f9b1257ab669026aeaf16";

const verifyUserToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
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
    const user = jwt.verify(token, JWT_SECRET);
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
