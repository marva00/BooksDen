const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./user.model');

const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  'bc992a20cb6706f741433686be814e3df45e57ea1c2fc85f9dbb0ef7df12308a669bfa7c976368ff32e32f6541480ce9ec1b122242f9b1257ab669026aeaf16';

const normalizeUsername = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const signAuthToken = (user) =>
  jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

const registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Do not hash here; model pre-save hook hashes once.
    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    const user = new User({
      username: normalizedUsername,
      password: normalizedPassword,
      role: normalizedRole,
    });
    await user.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Failed to register user', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Explicit password verification against stored hash.
    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password!' });
    }

    const token = signAuthToken(user);
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: { username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Failed to login', error);
    return res.status(500).json({ message: 'Failed to login' });
  }
};

const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    const admin = await User.findOne({ username: normalizedUsername, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found!' });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password!' });
    }

    const token = signAuthToken(admin);
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: { username: admin.username, role: admin.role },
    });
  } catch (error) {
    console.error('Failed to login as admin', error);
    return res.status(500).json({ message: 'Failed to login as admin' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
};
