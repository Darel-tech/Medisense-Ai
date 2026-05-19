const db = require('../config/database');

// 1. Submit Daily Monitoring Log Check-in
exports.createLog = async (req, res) => {
  const patientId = req.user.patient_id;
  const { assessmentId, improvement, newSymptoms, temperature, notes } = req.body;

  if (!assessmentId || !improvement) {
    return res.status(400).json({ message: 'Assessment ID and symptom trajectory (improvement) are required.' });
  }

  try {
    // A. Validate ownership and monitoring status
    const assessments = await db.query(
      'SELECT status, risk_level FROM assessments WHERE assessment_id = ? AND patient_id = ?',
      [assessmentId, patientId]
    );

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'Associated medical assessment not found.' });
    }

    if (assessments[0].status !== 'requires_monitoring') {
      return res.status(400).json({ message: 'Active 7-day monitoring is not required or already completed for this assessment.' });
    }

    // B. Insert the daily log
    // The database trigger "trg_check_monitoring_alert" will automatically fire on SQLite/MySQL,
    // analyzing historical logs to toggle alert_trigger and hospitalize flags!
    const today = new Date().toISOString().split('T')[0];
    
    // SQLite uses CURRENT_DATE automatically if check_date is null, but we supply it to be safe across engines
    const logRes = await db.execute(
      `INSERT INTO monitoring_logs (patient_id, assessment_id, check_date, improvement, new_symptoms, temperature, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patientId, assessmentId, today, improvement, newSymptoms || null, temperature || null, notes || null]
    );

    const logId = logRes.insertId;

    // C. Retrieve the post-processed row containing the trigger's computed alerts
    const logs = await db.query(
      'SELECT alert_trigger, hospitalize FROM monitoring_logs WHERE log_id = ?',
      [logId]
    );
    const logData = logs[0];

    // D. Auto-Resolution logic: If the patient registers "improving" and has logged 7 checkins, 
    // we can transition their assessment status to 'completed'
    const historicalLogs = await db.query(
      'SELECT COUNT(*) as log_count FROM monitoring_logs WHERE assessment_id = ?',
      [assessmentId]
    );
    const logCount = historicalLogs[0].log_count;

    let monitoringResolved = false;
    if (logCount >= 7 && improvement === 'improving' && !logData.hospitalize) {
      await db.execute(
        "UPDATE assessments SET status = 'completed' WHERE assessment_id = ?",
        [assessmentId]
      );
      monitoringResolved = true;
    }

    return res.status(201).json({
      message: 'Daily health check-in logged successfully.',
      log: {
        log_id: logId,
        days_logged: logCount,
        alert_triggered: logData.alert_trigger === 1,
        hospitalization_recommended: logData.hospitalize === 1,
        monitoring_resolved: monitoringResolved
      }
    });

  } catch (error) {
    console.error('❌ Daily Log Error: ', error);
    return res.status(500).json({ message: 'Failed to record health check-in: ' + error.message });
  }
};

// 2. Fetch 7-day Monitoring History for an Assessment
exports.getLogsByAssessment = async (req, res) => {
  const patientId = req.user.patient_id;
  const assessmentId = req.params.id;

  try {
    // Verify ownership
    const assessments = await db.query(
      'SELECT created_at, risk_level, status FROM assessments WHERE assessment_id = ? AND patient_id = ?',
      [assessmentId, patientId]
    );

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'Associated medical assessment not found.' });
    }

    const logs = await db.query(
      `SELECT log_id, check_date, improvement, new_symptoms, temperature, notes, alert_trigger, hospitalize, created_at
       FROM monitoring_logs
       WHERE assessment_id = ?
       ORDER BY check_date ASC`,
      [assessmentId]
    );

    return res.json({
      meta: assessments[0],
      logs
    });
  } catch (error) {
    console.error('❌ Get Logs Error: ', error);
    return res.status(500).json({ message: 'Failed to retrieve health logs: ' + error.message });
  }
};
