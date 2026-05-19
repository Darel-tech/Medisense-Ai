const db = require('../config/database');

// 1. Get Distinct Symptom Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await db.query('SELECT DISTINCT category FROM symptom_master ORDER BY category');
    return res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('❌ Get Categories Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve categories: ' + error.message });
  }
};

// 2. Get Symptoms (Optionally Filtered by Category)
exports.getSymptoms = async (req, res) => {
  const { category } = req.query;
  try {
    let symptoms;
    if (category) {
      symptoms = await db.query(
        'SELECT symptom_id, symptom_name, category, severity_weight, is_emergency_sign FROM symptom_master WHERE category = ? ORDER BY symptom_name',
        [category]
      );
    } else {
      symptoms = await db.query(
        'SELECT symptom_id, symptom_name, category, severity_weight, is_emergency_sign FROM symptom_master ORDER BY symptom_name'
      );
    }
    return res.json(symptoms);
  } catch (error) {
    console.error('❌ Get Symptoms Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve symptoms: ' + error.message });
  }
};

// 3. Get Diseases
exports.getDiseases = async (req, res) => {
  try {
    const diseases = await db.query('SELECT * FROM disease_master ORDER BY disease_name');
    return res.json(diseases);
  } catch (error) {
    console.error('❌ Get Diseases Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve diseases: ' + error.message });
  }
};

// 4. Create New Symptom Assessment (Fully Transactional)
exports.createAssessment = async (req, res) => {
  const patientId = req.user.patient_id;
  const { symptoms, notes } = req.body; // symptoms: [{ id, severity, duration }]

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ message: 'At least one symptom must be reported for clinical assessment.' });
  }

  try {
    // Execute inside transaction to ensure atomicity
    const assessmentResult = await db.transaction(async (tx) => {
      // Step A: Insert initial assessment shell
      const assessmentRes = await tx.execute(
        'INSERT INTO assessments (patient_id, notes) VALUES (?, ?)',
        [patientId, notes || null]
      );
      const assessmentId = assessmentRes.insertId;

      // Step B: Insert patient reported symptoms
      // Triggers trg_calculate_risk_score will automatically fire on the database,
      // calculating risk_score, risk_level, and status!
      for (const sym of symptoms) {
        await tx.execute(
          `INSERT INTO patient_symptoms (assessment_id, symptom_id, severity_rating, duration_days)
           VALUES (?, ?, ?, ?)`,
          [assessmentId, sym.id, sym.severity, sym.duration]
        );
      }

      // Step C: Retrieve the updated risk parameters calculated by the database trigger
      const updatedAssessments = await tx.query(
        'SELECT risk_score, risk_level, status FROM assessments WHERE assessment_id = ?',
        [assessmentId]
      );
      const assessmentMeta = updatedAssessments[0];

      // Step D: Clinical Symptom Matching Algorithm (Stored Procedure Simulation)
      const allDiseases = await tx.query('SELECT * FROM disease_master');
      const allMappings = await tx.query('SELECT * FROM disease_symptoms');

      const matchingDiseases = [];
      
      for (const disease of allDiseases) {
        const diseaseMappings = allMappings.filter(m => m.disease_id === disease.disease_id);
        if (diseaseMappings.length === 0) continue;

        let totalPotentialWeight = 0;
        let patientMatchedWeight = 0;
        let primarySymptomCount = 0;
        let patientPrimaryMatches = 0;

        for (const map of diseaseMappings) {
          if (map.is_primary) primarySymptomCount++;

          // Weighting: primary symptoms hold more significance (x1.5 multiplier)
          const mappingWeight = Number(map.occurrence_percent) * (map.is_primary ? 1.5 : 1.0);
          totalPotentialWeight += mappingWeight;

          const patientReport = symptoms.find(s => s.id === map.symptom_id);
          if (patientReport) {
            if (map.is_primary) patientPrimaryMatches++;
            // Scale by patient's reported severity (1-10)
            patientMatchedWeight += mappingWeight * (Number(patientReport.severity) / 10);
          }
        }

        if (patientMatchedWeight > 0) {
          // Calculate Jaccard similarity percentage
          let confidence = (patientMatchedWeight / totalPotentialWeight) * 100;
          
          // Boost confidence slightly if the patient exhibits multiple primary symptoms
          if (primarySymptomCount > 0 && patientPrimaryMatches > 0) {
            confidence += (patientPrimaryMatches / primarySymptomCount) * 15;
          }

          // Cap confidence at 98.5% (medicine is never 100% certain)
          confidence = Math.min(98.5, Math.max(12, confidence));

          matchingDiseases.push({
            id: disease.disease_id,
            name: disease.disease_name,
            confidence: parseFloat(confidence.toFixed(1)),
            severity: disease.severity_level,
            requires_care: disease.requires_care
          });
        }
      }

      // Sort matching diseases by confidence level
      matchingDiseases.sort((a, b) => b.confidence - a.confidence);

      // Select top matching disease, fallback to generic "Undetermined General Distress"
      let primaryDiagnosis = matchingDiseases[0];
      if (!primaryDiagnosis) {
        // Fallback matching
        primaryDiagnosis = {
          id: 1, // Common Cold or fallback
          name: 'Undetermined Viral/General Distress',
          confidence: 25.0,
          severity: 'low',
          requires_care: 0
        };
      }

      // Step E: Formulate customized clinical recommendation
      let recommendation = '';
      const isEmergency = symptoms.some(s => {
        // We can check if any symptom is an emergency sign
        return s.id === 3 || s.id === 6 || s.id === 21; // Shortness of Breath, Chest Pain, Severe Confusion
      }) || assessmentMeta.risk_level === 'high';

      if (isEmergency) {
        recommendation = `🚨 IMMEDIATE EMERGENCY NOTICE: Based on reported symptoms (${primaryDiagnosis.name}) and an elevated clinical Risk Score of ${Math.round(assessmentMeta.risk_score)}, you are exhibiting critical emergency indicators. Please proceed immediately to the nearest Emergency Department or call emergency medical services.`;
      } else if (assessmentMeta.risk_level === 'medium') {
        recommendation = `👨‍⚕️ MEDICAL CONSULTATION SUGGESTED: Analysis points towards ${primaryDiagnosis.name} with ${primaryDiagnosis.confidence}% confidence. Your health score indicates moderate risk. We recommend scheduling an outpatient appointment with a general physician within 24-48 hours. Start 7-day monitoring tracker on your dashboard.`;
      } else {
        recommendation = `🛌 SELF-CARE & MONITOR: Symptoms match ${primaryDiagnosis.name} (${primaryDiagnosis.confidence}% confidence). Clinical score indicates a low-risk profile. Hydrate, rest, and practice active isolation. If symptoms deteriorate or fever persists over 3 days, utilize the symptom check-in again.`;
      }

      // Step F: Save diagnosis result to database
      await tx.execute(
        `INSERT INTO diagnosis_results (assessment_id, disease_id, confidence, recommendation)
         VALUES (?, ?, ?, ?)`,
        [assessmentId, primaryDiagnosis.id, primaryDiagnosis.confidence, recommendation]
      );

      // Return complete payload for immediate frontend render
      return {
        assessment_id: assessmentId,
        risk_score: parseFloat(Number(assessmentMeta.risk_score).toFixed(1)),
        risk_level: assessmentMeta.risk_level,
        status: assessmentMeta.status,
        diagnosis: {
          disease_name: primaryDiagnosis.name,
          confidence: primaryDiagnosis.confidence,
          severity: primaryDiagnosis.severity,
          requires_care: primaryDiagnosis.requires_care,
          recommendation
        },
        differential_diagnoses: matchingDiseases.slice(1, 4) // Send up to 3 alternative diagnoses
      };
    });

    return res.status(201).json({
      message: 'Symptom assessment and clinical profiling completed.',
      assessment: assessmentResult
    });

  } catch (error) {
    console.error('❌ Create Assessment Error: ', error);
    return res.status(500).json({ message: 'Symptom analysis failed: ' + error.message });
  }
};

// 5. Retrieve Patient Assessment History
exports.getPatientAssessments = async (req, res) => {
  const patientId = req.user.patient_id;

  try {
    const assessments = await db.query(
      `SELECT a.assessment_id, a.risk_score, a.risk_level, a.status, a.notes, a.created_at,
              dr.confidence, dr.recommendation, dm.disease_name, dm.severity_level
       FROM assessments a
       LEFT JOIN diagnosis_results dr ON a.assessment_id = dr.assessment_id
       LEFT JOIN disease_master dm ON dr.disease_id = dm.disease_id
       WHERE a.patient_id = ?
       ORDER BY a.created_at DESC`,
      [patientId]
    );

    return res.json(assessments);
  } catch (error) {
    console.error('❌ Get Patient Assessments Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve assessment history: ' + error.message });
  }
};

// 6. Retrieve Detailed Assessment Report (With symptoms and diagnosis)
exports.getAssessmentById = async (req, res) => {
  const patientId = req.user.patient_id;
  const assessmentId = req.params.id;

  try {
    // 1. Fetch assessment summary
    const assessments = await db.query(
      `SELECT a.assessment_id, a.risk_score, a.risk_level, a.status, a.notes, a.created_at,
              dr.confidence, dr.recommendation, dm.disease_name, dm.severity_level
       FROM assessments a
       LEFT JOIN diagnosis_results dr ON a.assessment_id = dr.assessment_id
       LEFT JOIN disease_master dm ON dr.disease_id = dm.disease_id
       WHERE a.assessment_id = ? AND a.patient_id = ?`,
      [assessmentId, patientId]
    );

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'Medical assessment report not found.' });
    }

    // 2. Fetch all reported symptoms
    const symptoms = await db.query(
      `SELECT ps.severity_rating, ps.duration_days, sm.symptom_name, sm.category, sm.is_emergency_sign
       FROM patient_symptoms ps
       JOIN symptom_master sm ON ps.symptom_id = sm.symptom_id
       WHERE ps.assessment_id = ?`,
      [assessmentId]
    );

    return res.json({
      ...assessments[0],
      symptoms
    });
  } catch (error) {
    console.error('❌ Get Assessment Details Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve assessment details: ' + error.message });
  }
};
