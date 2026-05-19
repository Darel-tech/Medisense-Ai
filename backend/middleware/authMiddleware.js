const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'medisense_clinical_super_secret_key_2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing or malformed.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload ({ user_id, patient_id, email, role })
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = verifyToken;
