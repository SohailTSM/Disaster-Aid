module.exports = function allowedRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden: insufficient role'));
    }
    next();
  };
};
