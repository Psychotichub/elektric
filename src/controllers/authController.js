const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, role, site, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    // Only admins can create admin accounts
    if (role === 'admin') {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required to create admin account' 
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ 
            success: false,
            message: 'Only admins can create admin accounts' 
          });
        }
      } catch (error) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      password,
      site: site || '',
      company: company || '',
      role: role || 'user' // Default to user role
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password, site, company } = req.body;

    console.log('🔍 Login attempt:', { username, site, company });

    // Check database connection
    if (!User.db || User.db.readyState !== 1) {
      console.error('❌ Database not connected');
      return res.status(500).json({ 
        success: false,
        message: 'Database connection error. Please try again.' 
      });
    }

    // Find user by username, site, and company (case-insensitive)
    console.log('🔍 Searching for user with criteria:', { username, site, company });
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      site: { $regex: new RegExp(`^${site}$`, 'i') },
      company: { $regex: new RegExp(`^${company}$`, 'i') }
    });
    console.log('🔍 User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('✅ User details:', {
        id: user._id,
        username: user.username,
        site: user.site,
        company: user.company,
        role: user.role
      });
    }
    
    if (!user) {
      console.log('❌ No user found with these credentials');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Create token with better security
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        // Add timestamp to help with token refreshing
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie for better security
    if (req.cookies) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'strict'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        site: user.site,
        company: user.company,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin role required.' 
      });
    }

    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Database status check
exports.getDatabaseStatus = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    
    let status = 'unknown';
    switch (connectionState) {
      case 0: status = 'disconnected'; break;
      case 1: status = 'connected'; break;
      case 2: status = 'connecting'; break;
      case 3: status = 'disconnecting'; break;
    }
    
    res.status(200).json({
      success: true,
      database: {
        status: status,
        readyState: connectionState,
        name: process.env.DB_NAME || 'daily_report_system',
        uri: process.env.MONGO_URI ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    console.error('Database status check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
}; 