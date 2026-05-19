const db = require('../config/database');
const seedData = require('./seedData');

const initSchema = async () => {
  const dbType = db.getDbType();
  console.log(`🚀 [DB INIT] Initializing schema for: ${dbType.toUpperCase()}`);

  if (dbType === 'sqlite') {
    // ----------------------------------------------------
    // SQLITE SCHEMA CREATION
    // ----------------------------------------------------
    
    // Disable foreign keys temporarily during drop/creation
    await db.execute('PRAGMA foreign_keys = OFF');

    // Create Tables
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'patient',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS patients (
      patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      address TEXT,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS symptom_master (
      symptom_id INTEGER PRIMARY KEY AUTOINCREMENT,
      symptom_name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      severity_weight INTEGER NOT NULL,
      is_emergency_sign INTEGER DEFAULT 0
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS disease_master (
      disease_id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      severity_level TEXT NOT NULL,
      base_score REAL NOT NULL,
      requires_care INTEGER DEFAULT 0
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS disease_symptoms (
      mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_id INTEGER NOT NULL,
      symptom_id INTEGER NOT NULL,
      occurrence_percent REAL DEFAULT 50,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (disease_id) REFERENCES disease_master(disease_id) ON DELETE CASCADE,
      FOREIGN KEY (symptom_id) REFERENCES symptom_master(symptom_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS assessments (
      assessment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      risk_score REAL DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS patient_symptoms (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      symptom_id INTEGER NOT NULL,
      severity_rating INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
      FOREIGN KEY (symptom_id) REFERENCES symptom_master(symptom_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS diagnosis_results (
      diagnosis_id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      disease_id INTEGER NOT NULL,
      confidence REAL NOT NULL,
      recommendation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
      FOREIGN KEY (disease_id) REFERENCES disease_master(disease_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS monitoring_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      check_date TEXT DEFAULT CURRENT_DATE,
      improvement TEXT NOT NULL,
      new_symptoms TEXT,
      temperature REAL,
      notes TEXT,
      alert_trigger INTEGER DEFAULT 0,
      hospitalize INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS hospital_directory (
      hospital_id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_name TEXT NOT NULL,
      hospital_type TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      has_emergency INTEGER DEFAULT 1
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS chatbot_logs (
      chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      message_type TEXT NOT NULL,
      message_text TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    )`);

    // Enable foreign keys back
    await db.execute('PRAGMA foreign_keys = ON');

    // Create Triggers
    // Trigger 1: calculate_risk_score AFTER INSERT ON patient_symptoms
    await db.execute('DROP TRIGGER IF EXISTS trg_calculate_risk_score');
    await db.execute(`CREATE TRIGGER trg_calculate_risk_score AFTER INSERT ON patient_symptoms
      BEGIN
        -- Recalculate score
        UPDATE assessments
        SET risk_score = (
          SELECT COALESCE(SUM(sm.severity_weight * ps.severity_rating * (1 + ps.duration_days * 0.1)), 0)
          FROM patient_symptoms ps
          JOIN symptom_master sm ON ps.symptom_id = sm.symptom_id
          WHERE ps.assessment_id = NEW.assessment_id
        )
        WHERE assessment_id = NEW.assessment_id;
        
        -- Recalculate risk level and status based on score
        UPDATE assessments
        SET risk_level = CASE 
          WHEN risk_score < 30 THEN 'low'
          WHEN risk_score >= 30 AND risk_score <= 70 THEN 'medium'
          ELSE 'high'
        END,
        status = CASE
          WHEN risk_score >= 30 THEN 'requires_monitoring'
          ELSE 'completed'
        END
        WHERE assessment_id = NEW.assessment_id;
      END`);

    // Trigger 2: check_monitoring_alert AFTER INSERT ON monitoring_logs
    await db.execute('DROP TRIGGER IF EXISTS trg_check_monitoring_alert');
    await db.execute(`CREATE TRIGGER trg_check_monitoring_alert AFTER INSERT ON monitoring_logs
      BEGIN
        UPDATE monitoring_logs
        SET alert_trigger = CASE
          WHEN NEW.improvement = 'worse' AND (
            SELECT improvement FROM monitoring_logs 
            WHERE assessment_id = NEW.assessment_id AND log_id < NEW.log_id 
            ORDER BY log_id DESC LIMIT 1
          ) = 'worse' THEN 1
          ELSE 0
        END,
        hospitalize = CASE
          -- Urgent condition if worsening consecutively
          WHEN NEW.improvement = 'worse' AND (
            SELECT COUNT(*) FROM monitoring_logs 
            WHERE assessment_id = NEW.assessment_id AND improvement = 'worse'
          ) >= 2 THEN 1
          -- Critical alert if monitored for 5+ days with no improvements
          WHEN (
            SELECT COUNT(*) FROM monitoring_logs WHERE assessment_id = NEW.assessment_id
          ) >= 5 AND (
            SELECT COUNT(*) FROM monitoring_logs WHERE assessment_id = NEW.assessment_id AND improvement IN ('worse', 'same')
          ) >= 4 THEN 1
          ELSE 0
        END
        WHERE log_id = NEW.log_id;
      END`);

    // Create Views
    await db.execute('DROP VIEW IF EXISTS patient_dashboard');
    await db.execute(`CREATE VIEW patient_dashboard AS
      SELECT 
        p.patient_id, p.full_name, p.age, p.gender, p.city, p.pincode,
        COUNT(a.assessment_id) as total_assessments,
        AVG(a.risk_score) as avg_risk_score,
        (SELECT risk_level FROM assessments WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as latest_risk_level,
        (SELECT created_at FROM assessments WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as last_active
      FROM patients p
      LEFT JOIN assessments a ON p.patient_id = a.patient_id
      GROUP BY p.patient_id`);

    await db.execute('DROP VIEW IF EXISTS disease_statistics');
    await db.execute(`CREATE VIEW disease_statistics AS
      SELECT 
        dm.disease_name, dm.category,
        COUNT(dr.diagnosis_id) as diagnosed_count,
        AVG(dr.confidence) as avg_confidence
      FROM disease_master dm
      LEFT JOIN diagnosis_results dr ON dm.disease_id = dr.disease_id
      GROUP BY dm.disease_id`);

    await db.execute('DROP VIEW IF EXISTS active_monitoring');
    await db.execute(`CREATE VIEW active_monitoring AS
      SELECT 
        a.assessment_id, p.full_name, a.risk_level, a.risk_score, a.created_at as assessed_on,
        COUNT(ml.log_id) as days_logged,
        (SELECT improvement FROM monitoring_logs WHERE assessment_id = a.assessment_id ORDER BY created_at DESC LIMIT 1) as latest_condition,
        (SELECT MAX(alert_trigger) FROM monitoring_logs WHERE assessment_id = a.assessment_id) as alert_active,
        (SELECT MAX(hospitalize) FROM monitoring_logs WHERE assessment_id = a.assessment_id) as requires_hospitalization
      FROM assessments a
      JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN monitoring_logs ml ON a.assessment_id = ml.assessment_id
      WHERE a.status = 'requires_monitoring'
      GROUP BY a.assessment_id`);

  } else {
    // ----------------------------------------------------
    // MYSQL SCHEMA CREATION
    // ----------------------------------------------------
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');

    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'patient',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS patients (
      patient_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(50) NOT NULL,
      address TEXT,
      city VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS symptom_master (
      symptom_id INT AUTO_INCREMENT PRIMARY KEY,
      symptom_name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      severity_weight INT NOT NULL,
      is_emergency_sign TINYINT DEFAULT 0
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS disease_master (
      disease_id INT AUTO_INCREMENT PRIMARY KEY,
      disease_name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      severity_level VARCHAR(50) NOT NULL,
      base_score DECIMAL(5,2) NOT NULL,
      requires_care TINYINT DEFAULT 0
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS disease_symptoms (
      mapping_id INT AUTO_INCREMENT PRIMARY KEY,
      disease_id INT NOT NULL,
      symptom_id INT NOT NULL,
      occurrence_percent DECIMAL(5,2) DEFAULT 50.0,
      is_primary TINYINT DEFAULT 0,
      FOREIGN KEY (disease_id) REFERENCES disease_master(disease_id) ON DELETE CASCADE,
      FOREIGN KEY (symptom_id) REFERENCES symptom_master(symptom_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS assessments (
      assessment_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      risk_score DECIMAL(5,2) DEFAULT 0.0,
      risk_level VARCHAR(50) DEFAULT 'low',
      status VARCHAR(50) DEFAULT 'completed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS patient_symptoms (
      record_id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      symptom_id INT NOT NULL,
      severity_rating INT NOT NULL,
      duration_days INT NOT NULL,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
      FOREIGN KEY (symptom_id) REFERENCES symptom_master(symptom_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS diagnosis_results (
      diagnosis_id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      disease_id INT NOT NULL,
      confidence DECIMAL(5,2) NOT NULL,
      recommendation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
      FOREIGN KEY (disease_id) REFERENCES disease_master(disease_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS monitoring_logs (
      log_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      assessment_id INT NOT NULL,
      check_date DATE NOT NULL,
      improvement VARCHAR(50) NOT NULL,
      new_symptoms TEXT,
      temperature DECIMAL(4,2),
      notes TEXT,
      alert_trigger TINYINT DEFAULT 0,
      hospitalize TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS hospital_directory (
      hospital_id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_name VARCHAR(255) NOT NULL,
      hospital_type VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      has_emergency TINYINT DEFAULT 1
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS chatbot_logs (
      chat_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      message_type VARCHAR(50) NOT NULL,
      message_text TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    )`);

    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Create Triggers
    await db.execute('DROP TRIGGER IF EXISTS trg_calculate_risk_score');
    await db.execute(`CREATE TRIGGER trg_calculate_risk_score AFTER INSERT ON patient_symptoms
      FOR EACH ROW
      BEGIN
        -- Calculate the risk score
        UPDATE assessments
        SET risk_score = (
          SELECT COALESCE(SUM(sm.severity_weight * ps.severity_rating * (1 + ps.duration_days * 0.1)), 0)
          FROM patient_symptoms ps
          JOIN symptom_master sm ON ps.symptom_id = sm.symptom_id
          WHERE ps.assessment_id = NEW.assessment_id
        )
        WHERE assessment_id = NEW.assessment_id;

        -- Update risk level and status
        UPDATE assessments
        SET risk_level = CASE 
          WHEN risk_score < 30 THEN 'low'
          WHEN risk_score >= 30 AND risk_score <= 70 THEN 'medium'
          ELSE 'high'
        END,
        status = CASE
          WHEN risk_score >= 30 THEN 'requires_monitoring'
          ELSE 'completed'
        END
        WHERE assessment_id = NEW.assessment_id;
      END`);

    await db.execute('DROP TRIGGER IF EXISTS trg_check_monitoring_alert');
    await db.execute(`CREATE TRIGGER trg_check_monitoring_alert BEFORE INSERT ON monitoring_logs
      FOR EACH ROW
      BEGIN
        DECLARE last_condition VARCHAR(50);
        DECLARE worse_count INT;
        DECLARE log_count INT;
        DECLARE bad_log_count INT;

        -- Get last condition
        SELECT improvement INTO last_condition FROM monitoring_logs 
        WHERE assessment_id = NEW.assessment_id 
        ORDER BY log_id DESC LIMIT 1;

        -- Count worsening logs
        SELECT COUNT(*) INTO worse_count FROM monitoring_logs 
        WHERE assessment_id = NEW.assessment_id AND improvement = 'worse';

        -- Count total logs
        SELECT COUNT(*) INTO log_count FROM monitoring_logs WHERE assessment_id = NEW.assessment_id;
        
        -- Count bad logs
        SELECT COUNT(*) INTO bad_log_count FROM monitoring_logs 
        WHERE assessment_id = NEW.assessment_id AND improvement IN ('worse', 'same');

        -- Set flags on the inserting row
        IF NEW.improvement = 'worse' AND last_condition = 'worse' THEN
          SET NEW.alert_trigger = 1;
        END IF;

        IF NEW.improvement = 'worse' AND worse_count >= 1 THEN
          SET NEW.hospitalize = 1;
        ELSEIF log_count >= 4 AND bad_log_count >= 3 AND NEW.improvement IN ('worse', 'same') THEN
          SET NEW.hospitalize = 1;
        END IF;
      END`);

    // Views
    await db.execute('DROP VIEW IF EXISTS patient_dashboard');
    await db.execute(`CREATE VIEW patient_dashboard AS
      SELECT 
        p.patient_id, p.full_name, p.age, p.gender, p.city, p.pincode,
        COUNT(a.assessment_id) as total_assessments,
        AVG(a.risk_score) as avg_risk_score,
        (SELECT risk_level FROM assessments WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as latest_risk_level,
        (SELECT created_at FROM assessments WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as last_active
      FROM patients p
      LEFT JOIN assessments a ON p.patient_id = a.patient_id
      GROUP BY p.patient_id`);

    await db.execute('DROP VIEW IF EXISTS disease_statistics');
    await db.execute(`CREATE VIEW disease_statistics AS
      SELECT 
        dm.disease_name, dm.category,
        COUNT(dr.diagnosis_id) as diagnosed_count,
        AVG(dr.confidence) as avg_confidence
      FROM disease_master dm
      LEFT JOIN diagnosis_results dr ON dm.disease_id = dr.disease_id
      GROUP BY dm.disease_id`);

    await db.execute('DROP VIEW IF EXISTS active_monitoring');
    // For MySQL we group properly
    await db.execute(`CREATE VIEW active_monitoring AS
      SELECT 
        a.assessment_id, p.full_name, a.risk_level, a.risk_score, a.created_at as assessed_on,
        (SELECT COUNT(*) FROM monitoring_logs WHERE assessment_id = a.assessment_id) as days_logged,
        (SELECT improvement FROM monitoring_logs WHERE assessment_id = a.assessment_id ORDER BY created_at DESC LIMIT 1) as latest_condition,
        (SELECT COALESCE(MAX(alert_trigger), 0) FROM monitoring_logs WHERE assessment_id = a.assessment_id) as alert_active,
        (SELECT COALESCE(MAX(hospitalize), 0) FROM monitoring_logs WHERE assessment_id = a.assessment_id) as requires_hospitalization
      FROM assessments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.status = 'requires_monitoring'`);
  }

  // Seed reference data
  console.log('🌱 Seeding reference tables...');
  
  // 1. Seed Symptoms
  for (const sym of seedData.symptoms) {
    await db.execute(
      `INSERT OR IGNORE INTO symptom_master (symptom_name, category, severity_weight, is_emergency_sign)
       VALUES (?, ?, ?, ?)`
       .replace('INSERT OR IGNORE', dbType === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE'),
      [sym.name, sym.category, sym.weight, sym.is_emergency]
    );
  }

  // 2. Seed Diseases
  for (const dis of seedData.diseases) {
    await db.execute(
      `INSERT OR IGNORE INTO disease_master (disease_name, category, severity_level, base_score, requires_care)
       VALUES (?, ?, ?, ?, ?)`
       .replace('INSERT OR IGNORE', dbType === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE'),
      [dis.name, dis.category, dis.severity, dis.base_score, dis.requires_care]
    );
  }

  // Fetch created symptoms and diseases to seed mappings
  const symptomsFromDb = await db.query('SELECT symptom_id, symptom_name FROM symptom_master');
  const diseasesFromDb = await db.query('SELECT disease_id, disease_name FROM disease_master');
  
  const symMap = new Map(symptomsFromDb.map(s => [s.symptom_name, s.symptom_id]));
  const disMap = new Map(diseasesFromDb.map(d => [d.disease_name, d.disease_id]));

  // 3. Seed Mappings
  for (const mapping of seedData.diseaseSymptoms) {
    const symptomId = symMap.get(mapping.symptom);
    const diseaseId = disMap.get(mapping.disease);
    
    if (symptomId && diseaseId) {
      // Check if mapping exists
      const existing = await db.query(
        'SELECT mapping_id FROM disease_symptoms WHERE disease_id = ? AND symptom_id = ?',
        [diseaseId, symptomId]
      );
      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO disease_symptoms (disease_id, symptom_id, occurrence_percent, is_primary) VALUES (?, ?, ?, ?)',
          [diseaseId, symptomId, mapping.occurrence, mapping.is_primary]
        );
      }
    }
  }

  // 4. Seed Hospitals
  for (const hosp of seedData.hospitals) {
    const existing = await db.query(
      'SELECT hospital_id FROM hospital_directory WHERE hospital_name = ? AND city = ?',
      [hosp.name, hosp.city]
    );
    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO hospital_directory (hospital_name, hospital_type, address, city, pincode, latitude, longitude, has_emergency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [hosp.name, hosp.type, hosp.address, hosp.city, hosp.pincode, hosp.lat, hosp.lng, hosp.emergency]
      );
    }
  }

  console.log('💚 [DB SEED] References database seeding completed successfully.');
};

module.exports = {
  initSchema
};
