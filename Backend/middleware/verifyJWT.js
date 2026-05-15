const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('verifyJWT: Missing or malformed Authorization header');
    return res.status(401).json({ message: 'Unauthorized - missing token' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.warn('verifyJWT: Token verification failed', err && err.message);
      return res.status(403).json({ message: 'Forbidden - invalid token' });
    }

    // Ensure decoded payload has expected structure
    if (!decoded || !decoded.UserInfo) {
      console.warn('verifyJWT: Token decoded but missing UserInfo payload', decoded);
      return res.status(403).json({ message: 'Forbidden - invalid token payload' });
    }

    req.user = decoded.UserInfo;
    next();
  });
};

module.exports = verifyJWT;
