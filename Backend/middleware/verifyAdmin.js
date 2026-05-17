const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'administrator') {
    return res.status(403).json({ message: 'Access denied. Administrator role required.' });
  }
  next();
};

module.exports = verifyAdmin;

