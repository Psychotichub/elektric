const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, role, site, company } = req.body;

    console.log('🔍 Registration attempt:', { username, site, company, role });

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    // Check authentication for creating admin/manager accounts
    if (role === 'admin' || role === 'manager') {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required to create admin/manager account' 
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Allow managers and admins to create admin/manager accounts
        if (decoded.role !== 'admin' && decoded.role !== 'manager') {
          return res.status(403).json({ 
            success: false,
            message: 'Only managers and admins can create admin/manager accounts' 
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
    console.log('✅ User saved to main database');

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ Registration completed successfully for:', username);

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

    // First, try to find user by username only (for managers)
    console.log('🔍 Searching for user by username only:', { username });
    let user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    console.log('🔍 Initial user search result:', user ? {
      username: user.username,
      role: user.role,
      site: user.site,
      company: user.company
    } : 'No user found');

    // If user found and is a manager, allow login without site/company
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      console.log('✅ Manager/Admin login - bypassing site/company validation');
    } else {
      // For regular users, require site and company
      if (!site || !company) {
        console.log('❌ Site and company required for regular users');
        return res.status(400).json({ 
          success: false,
          message: 'Site and company are required for regular users' 
        });
      }

      // Find user by username, site, and company (case-insensitive)
      console.log('🔍 Searching for regular user with criteria:', { username, site, company });
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        site: { $regex: new RegExp(`^${site}$`, 'i') },
        company: { $regex: new RegExp(`^${company}$`, 'i') }
      });
    }

    console.log('🔍 Final user found:', user ? 'Yes' : 'No');
    
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
    console.log('🔍 Checking password for user:', user.username);
    const isMatch = await user.comparePassword(password);
    console.log('🔍 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log('✅ Password verified successfully');

    // Create token with better security
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        site: user.site,
        company: user.company,
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
        role: user.role,
        site: user.site,
        company: user.company
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

// Get users (for managers)
exports.getUsers = async (req, res) => {
  try {
    // Check authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'manager' && decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Manager privileges required.' 
      });
    }

    // Get recent users (last 50)
    const users = await User.find({})
      .select('-password') // Exclude password
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50);

    console.log(`✅ Retrieved ${users.length} users for manager`);

    res.status(200).json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Get users error:', error);
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