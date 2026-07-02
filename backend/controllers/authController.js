const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route POST /api/auth/register
// @desc  Register a new user. Role defaults to 'customer'.
//        (Admin accounts should be created via seed script or promoted directly in DB
//         — this keeps the public registration endpoint from being an admin backdoor.)
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are all required.', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const user = await User.create({ name, email, password, role: 'customer' });
    const token = generateToken(user);

    res.status(201).json({ user: user.toSafeObject(), token });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken(user);
    res.status(200).json({ user: user.toSafeObject(), token });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
