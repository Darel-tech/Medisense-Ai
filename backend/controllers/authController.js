const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'medisense_clinical_super_secret_key_2026';

// Patient Onboarding Registration (using unified transactional wrapper)
exports.register = async (req, res) => {
  const { email, password, fullName, age, gender, address, city, pincode } = req.body;

  if (!email || !password || !fullName || !age || !gender || !city || !pincode) {
    return res.status(400).json({ message: 'All profile fields are mandatory for clinical registration.' });
  }

  try {
    // 1. Check if email already exists
    const existingUsers = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'A medical account with this email already exists.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Execute Transaction
    const registrationResult = await db.transaction(async (tx) => {
      // Insert into users
      const userRes = await tx.execute(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, passwordHash, 'patient']
      );
      const userId = userRes.insertId;

      // Insert into patients
      const patientRes = await tx.execute(
        `INSERT INTO patients (user_id, full_name, age, gender, address, city, pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName, age, gender, address || null, city, pincode]
      );
      
      return {
        userId,
        patientId: patientRes.insertId,
        fullName
      };
    });

    // 4. Generate JWT Session Token
    const token = jwt.sign(
      { 
        user_id: registrationResult.userId, 
        patient_id: registrationResult.patientId,
        email, 
        role: 'patient',
        name: registrationResult.fullName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Onboarding completed successfully.',
      token,
      user: {
        userId: registrationResult.userId,
        patientId: registrationResult.patientId,
        email,
        fullName: registrationResult.fullName
      }
    });

  } catch (error) {
    console.error('❌ Registration Error: ', error);
    return res.status(500).json({ message: 'Clinical registration failed: ' + error.message });
  }
};

// User / Patient Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Fetch user authentication credentials
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. Please verify details.' });
    }
    const user = users[0];

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please verify details.' });
    }

    // 3. Fetch detailed patient profile details
    const patients = await db.query('SELECT patient_id, full_name FROM patients WHERE user_id = ?', [user.user_id]);
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient profile not found. Please re-register.' });
    }
    const patient = patients[0];

    // 4. Generate JWT Session Token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        patient_id: patient.patient_id,
        email: user.email, 
        role: user.role,
        name: patient.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Authentication successful.',
      token,
      user: {
        userId: user.user_id,
        patientId: patient.patient_id,
        email: user.email,
        fullName: patient.full_name
      }
    });

  } catch (error) {
    console.error('❌ Login Error: ', error);
    return res.status(500).json({ message: 'Server login error: ' + error.message });
  }
};
