const jwt = require('jsonwebtoken');
// Use env JWT secret if provided, otherwise fall back to the README value
const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  'bc992a20cb6706f741433686be814e3df45e57ea1c2fc85f9dbb0ef7df12308a669bfa7c976368ff32e32f6541480ce9ec1b122242f9b1257ab669026aeaf16'

const verifyAdminToken =  (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    // console.log(token)

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid credientials' });
        }
        if (user?.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        req.user = user;
        next();
    })

}

module.exports = verifyAdminToken;