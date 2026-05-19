const db = require('../config/database');

// Retrieve patient clinical profile details
exports.getProfile = async (req, res) => {
  const patientId = req.user.patient_id;

  try {
    const patients = await db.query(
      `SELECT p.patient_id, p.full_name, p.age, p.gender, p.address, p.city, p.pincode, u.email, u.created_at
       FROM patients p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.patient_id = ?`,
      [patientId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient profile not found.' });
    }

    return res.json(patients[0]);
  } catch (error) {
    console.error('❌ Get Profile Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve profile: ' + error.message });
  }
};

// Update patient clinical profile details
exports.updateProfile = async (req, res) => {
  const patientId = req.user.patient_id;
  const { fullName, age, gender, address, city, pincode } = req.body;

  if (!fullName || !age || !gender || !city || !pincode) {
    return res.status(400).json({ message: 'Required fields (fullName, age, gender, city, pincode) cannot be empty.' });
  }

  try {
    const updateResult = await db.execute(
      `UPDATE patients 
       SET full_name = ?, age = ?, gender = ?, address = ?, city = ?, pincode = ?
       WHERE patient_id = ?`,
      [fullName, age, gender, address || null, city, pincode, patientId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Patient profile was not found to update.' });
    }

    return res.json({
      message: 'Clinical profile updated successfully.',
      user: {
        patientId,
        fullName
      }
    });
  } catch (error) {
    console.error('❌ Update Profile Error: ', error);
    return res.status(500).json({ message: 'Failed to update profile: ' + error.message });
  }
};
