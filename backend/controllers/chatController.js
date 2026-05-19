const db = require('../config/database');
const https = require('https');
require('dotenv').config();

// Unified Chat Log Retrieval
exports.getChatHistory = async (req, res) => {
  const patientId = req.user.patient_id;

  try {
    const chatHistory = await db.query(
      `SELECT chat_id, message_type, message_text, timestamp
       FROM chatbot_logs
       WHERE patient_id = ?
       ORDER BY timestamp ASC LIMIT 100`,
      [patientId]
    );

    return res.json(chatHistory);
  } catch (error) {
    console.error('❌ Get Chat History Error: ', error);
    return res.status(500).json({ message: 'Failed to fetch conversation history: ' + error.message });
  }
};

// Send Message to Chatbot (Integrates Claude API or Smart Fallback)
exports.sendMessage = async (req, res) => {
  const patientId = req.user.patient_id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message content is blank.' });
  }

  try {
    // 1. Log the user's message in chatbot_logs
    await db.execute(
      'INSERT INTO chatbot_logs (patient_id, message_type, message_text) VALUES (?, ?, ?)',
      [patientId, 'user', message]
    );

    let botResponse = '';

    // 2. Check if Claude AI is configured
    if (process.env.CLAUDE_API_KEY) {
      console.log('🤖 Routing chat query to Anthropic Claude...');
      try {
        botResponse = await callClaudeAPI(message);
      } catch (err) {
        console.warn('⚠️ Anthropic API call failed, deploying local clinical response engine: ' + err.message);
        botResponse = generateFallbackResponse(message);
      }
    } else {
      // Execute local clinical keyword parser
      botResponse = generateFallbackResponse(message);
    }

    // 3. Log the bot's response in chatbot_logs
    await db.execute(
      'INSERT INTO chatbot_logs (patient_id, message_type, message_text) VALUES (?, ?, ?)',
      [patientId, 'bot', botResponse]
    );

    return res.status(201).json({
      message: 'Message processed.',
      userMessage: message,
      reply: botResponse
    });

  } catch (error) {
    console.error('❌ Chat Processor Error: ', error);
    return res.status(500).json({ message: 'Chatbot engine malfunction: ' + error.message });
  }
};

// Helper: Call Claude API (Anthropic Messages API protocol)
const callClaudeAPI = (userText) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: `You are Dr. Claude, the friendly, professional AI clinical screening assistant for MediSense-Ai. 
      You help screen symptoms and explain medical concepts. 
      CRITICAL SAFETY DIRECTIVE: If the user describes emergency symptoms (like sudden chest pain, crushing breath, sudden severe confusion, slurred speech, or high-risk cardiac symptoms), tell them in the FIRST SENTENCE to call 911 or visit the nearest ER immediately, and point them to use the Hospital Finder card on their dashboard. Otherwise, gently prompt them to run a formal symptom diagnostic using the 'Symptom Assessment' card. Always keep responses brief, encouraging, and highly clinical.`,
      messages: [{ role: 'user', content: userText }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.content && parsed.content[0] && parsed.content[0].text) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error(parsed.error ? parsed.error.message : 'Invalid API response format'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

// Helper: Local Clinical Response Generator (Keyword Parsing Simulator)
const generateFallbackResponse = (text) => {
  const query = text.toLowerCase();
  
  // Emergency checks
  if (
    query.includes('chest pain') || 
    query.includes('heart pain') || 
    query.includes('heart attack') || 
    query.includes('stroke') || 
    query.includes('shortness of breath') || 
    query.includes('breathing difficulty') || 
    query.includes('hard to breathe') ||
    query.includes('passed out') ||
    query.includes('unconscious')
  ) {
    return `🚨 EMERGENCY RED FLAG DETECTED: The symptoms you described (chest discomfort / severe shortness of breath) require immediate emergency evaluation. Please CALL 911 or proceed to the nearest Emergency Clinic immediately! 

To locate the nearest emergency rooms, please close this chat and use the 'Hospital Finder' card on your Bento Grid dashboard, which has been loaded with emergency care facilities in your region. Do not wait for symptom diagnostic logs.`;
  }

  // Symptom check matches
  if (
    query.includes('fever') || 
    query.includes('temp') || 
    query.includes('cough') || 
    query.includes('throat') || 
    query.includes('flu') || 
    query.includes('cold') || 
    query.includes('headache') || 
    query.includes('migraine') || 
    query.includes('nausea') || 
    query.includes('vomit') || 
    query.includes('stomach') || 
    query.includes('diarrhea') ||
    query.includes('symptom')
  ) {
    return `🩺 Dr. MediSense: It sounds like you are experiencing some active symptoms. To help me analyze them accurately, please navigate to the 'Symptom Assessment' card in the center of your Bento Grid. 

There, you can select your symptoms, rate their clinical severity from 1 to 10, and input their duration. Our database engine will compute a specialized Health Risk Score and matching diagnosis for you, and automatically trigger 7-day health tracking logs!`;
  }

  // Hospital Finder matching
  if (
    query.includes('hospital') || 
    query.includes('doctor') || 
    query.includes('clinic') || 
    query.includes('er') || 
    query.includes('pincode')
  ) {
    return `🏥 Dr. MediSense: I can help you find nearby healthcare facilities! I see you are registered with us. 

To look up emergency clinics and trauma centers, please use the 'Hospital Finder' card located on your Bento Grid dashboard. It will automatically load the top clinical centers in your city. You can also search by custom pincodes or cities to find other specialized centers!`;
  }

  // 7-day monitoring checks
  if (
    query.includes('track') || 
    query.includes('monitor') || 
    query.includes('calendar') || 
    query.includes('checkin') || 
    query.includes('daily log')
  ) {
    return `📅 Dr. MediSense: Our 7-Day Patient Monitoring feature keeps a close check on moderate and high-risk conditions. If you recently completed an assessment that requires monitoring, you'll see a clinical timeline on your dashboard. 

Please log your symptom check-in daily! If your symptoms worsen consecutively, our backend database triggers will automatically alert you and suggest hospitalization recommendations. If you stay on a trajectory of recovery for 7 days, your assessment status will automatically resolve to 'Completed'.`;
  }

  // Default friendly guidance
  return `👋 Hello! I am Dr. MediSense, your clinical screening assistant. I am here to help guide you through our health assessment features. 

On your Bento Grid dashboard, you can:
1. 🩺 Submit detailed assessments using the 'Symptom Assessment' terminal.
2. 📅 Track your recovery timeline using the '7-Day Health Tracker'.
3. 🏥 Locate emergency departments nearby with our 'Hospital Finder' map directory.
4. ⚙️ Update your contact card via the 'Patient Profile'.

What symptoms or concepts can I help explain for you today?`;
};
