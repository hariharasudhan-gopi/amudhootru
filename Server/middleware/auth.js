function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.user = req.session.user;
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.session.user.isAdminUser) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.user = req.session.user;
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
