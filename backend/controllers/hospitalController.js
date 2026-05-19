const db = require('../config/database');

// Retrieve hospitals nearby the patient
exports.getNearbyHospitals = async (req, res) => {
  const patientId = req.user.patient_id;
  const { city, pincode, emergencyOnly } = req.query;

  try {
    let searchCity = city;
    let searchPincode = pincode;

    // If pincode/city is not supplied in query, fetch contextually from patient profile!
    if (!searchCity && !searchPincode) {
      const patientProfile = await db.query(
        'SELECT city, pincode FROM patients WHERE patient_id = ?',
        [patientId]
      );
      if (patientProfile.length > 0) {
        searchCity = patientProfile[0].city;
        searchPincode = patientProfile[0].pincode;
      }
    }

    let sql = 'SELECT * FROM hospital_directory WHERE 1=1';
    const params = [];

    // Filter logic
    if (searchCity && searchPincode) {
      sql += ' AND (LOWER(city) = LOWER(?) OR pincode = ?)';
      params.push(searchCity, searchPincode);
    } else if (searchCity) {
      sql += ' AND LOWER(city) = LOWER(?)';
      params.push(searchCity);
    } else if (searchPincode) {
      sql += ' AND pincode = ?';
      params.push(searchPincode);
    }

    if (emergencyOnly === 'true' || emergencyOnly === '1') {
      sql += ' AND has_emergency = 1';
    }

    // Rank emergency facilities higher, then sort alphabetically
    sql += ' ORDER BY has_emergency DESC, hospital_name ASC LIMIT 10';

    const hospitals = await db.query(sql, params);
    
    return res.json({
      searchCriteria: {
        city: searchCity || 'Not specified',
        pincode: searchPincode || 'Not specified'
      },
      hospitals
    });

  } catch (error) {
    console.error('❌ Hospital Locator Error: ', error);
    return res.status(500).json({ message: 'Failed to search nearby clinics: ' + error.message });
  }
};
