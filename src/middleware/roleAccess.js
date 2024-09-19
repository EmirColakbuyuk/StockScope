const roleAccess = (requiredRole) => {
  return (req, res, next) => {
    // Check if the user is authenticated and has a role
    if (!req.user || typeof req.user.role !== 'number') {
      return res.status(403).json({ message: 'Access denied, no role found' });
    }

    console.log(req.user.role);
    // Check if the user's role meets the required role
    if (req.user.role > requiredRole) {
      return res.status(403).json({ message: 'Access denied, insufficient permissions' });
    }

    next();
  };
};

module.exports = roleAccess;