const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_development';

// Authenticate middleware - verify token and set req.user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = 
      req.headers.authorization?.split(' ')[1] || 
      (req.cookies ? req.cookies.token : null);
      
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }
};

// Alias for authenticateToken (for compatibility)
exports.authenticateToken = exports.authenticate;

// Authorize middleware - check if user has admin role
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// Manager access middleware - check if user has manager or admin role
exports.requireManagerAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  // Check if user has manager or admin role
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Manager privileges required.' 
    });
  }

  next();
};

// Site-based authorization middleware - ALL users (including admins) are restricted to their own site
exports.requireSiteAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  // ALL users (including admins) can only access their own site
  if (!req.user.site) {
    return res.status(403).json({ 
      success: false, 
      message: 'Site access not configured for this user.' 
    });
  }

  // Add site filter to request for controllers to use
  req.userSite = req.user.site;
  req.userCompany = req.user.company;
  
  next();
};

// Create a generic authorization middleware for specific actions
exports.authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }
    
    if (requiredRole === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  };
}; 