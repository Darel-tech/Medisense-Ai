const db = require('../config/database');

// Aggregate multiple views to build high-fidelity bento metrics
exports.getDashboardSummary = async (req, res) => {
  const patientId = req.user.patient_id;

  try {
    // 1. Query 'patient_dashboard' view for overall stats
    const patientStats = await db.query(
      'SELECT * FROM patient_dashboard WHERE patient_id = ?',
      [patientId]
    );

    if (patientStats.length === 0) {
      return res.status(404).json({ message: 'Patient analytics not found.' });
    }

    // 2. Query 'active_monitoring' view to check if there is an active tracking assessment
    const dbType = db.getDbType();
    // For SQLite view has WHERE conditions grouped. Let's filter by patientId contextually
    let monitoringLogs = [];
    if (dbType === 'sqlite') {
      monitoringLogs = await db.query(
        `SELECT am.* FROM active_monitoring am
         JOIN assessments a ON am.assessment_id = a.assessment_id
         WHERE a.patient_id = ?`,
        [patientId]
      );
    } else {
      // MySQL active_monitoring view already filters or provides assessment mappings
      monitoringLogs = await db.query(
        `SELECT am.* FROM active_monitoring am
         JOIN assessments a ON am.assessment_id = a.assessment_id
         WHERE a.patient_id = ?`,
        [patientId]
      );
    }

    // 3. Query 'disease_statistics' view to show medical incidence rates
    const epidemicStats = await db.query(
      'SELECT disease_name, diagnosed_count, avg_confidence FROM disease_statistics WHERE diagnosed_count > 0 ORDER BY diagnosed_count DESC LIMIT 5'
    );

    // 4. Retrieve recent assessments (last 3) with diagnoses details
    const recentAssessments = await db.query(
      `SELECT a.assessment_id, a.risk_score, a.risk_level, a.status, a.created_at,
              dr.confidence, dm.disease_name
       FROM assessments a
       LEFT JOIN diagnosis_results dr ON a.assessment_id = dr.assessment_id
       LEFT JOIN disease_master dm ON dr.disease_id = dm.disease_id
       WHERE a.patient_id = ?
       ORDER BY a.created_at DESC LIMIT 3`,
      [patientId]
    );

    return res.json({
      profileSummary: patientStats[0],
      activeMonitoring: monitoringLogs[0] || null,
      incidenceRates: epidemicStats,
      recentAssessments
    });

  } catch (error) {
    console.error('❌ Dashboard Summary Error: ', error);
    return res.status(500).json({ message: 'Failed to compile health dashboard: ' + error.message });
  }
};
