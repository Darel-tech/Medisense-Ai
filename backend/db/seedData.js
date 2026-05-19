const symptoms = [
  { name: 'Fever', category: 'General', weight: 3, is_emergency: 0 },
  { name: 'Cough', category: 'Respiratory', weight: 2, is_emergency: 0 },
  { name: 'Shortness of Breath', category: 'Respiratory', weight: 8, is_emergency: 1 },
  { name: 'Sore Throat', category: 'Respiratory', weight: 1, is_emergency: 0 },
  { name: 'Runny Nose', category: 'Respiratory', weight: 1, is_emergency: 0 },
  { name: 'Chest Pain', category: 'Cardiovascular', weight: 9, is_emergency: 1 },
  { name: 'Headache', category: 'Neurological', weight: 2, is_emergency: 0 },
  { name: 'Fatigue', category: 'General', weight: 2, is_emergency: 0 },
  { name: 'Nausea', category: 'Gastrointestinal', weight: 2, is_emergency: 0 },
  { name: 'Vomiting', category: 'Gastrointestinal', weight: 3, is_emergency: 0 },
  { name: 'Diarrhea', category: 'Gastrointestinal', weight: 3, is_emergency: 0 },
  { name: 'Muscle Aches', category: 'Musculoskeletal', weight: 2, is_emergency: 0 },
  { name: 'Loss of Smell or Taste', category: 'Sensory', weight: 4, is_emergency: 0 },
  { name: 'Dizziness', category: 'Neurological', weight: 4, is_emergency: 0 },
  { name: 'Abdominal Pain', category: 'Gastrointestinal', weight: 4, is_emergency: 0 },
  { name: 'Skin Rash', category: 'Dermatological', weight: 2, is_emergency: 0 },
  { name: 'Chills', category: 'General', weight: 2, is_emergency: 0 },
  { name: 'Wheezing', category: 'Respiratory', weight: 5, is_emergency: 0 },
  { name: 'Joint Pain', category: 'Musculoskeletal', weight: 2, is_emergency: 0 },
  { name: 'Loss of Appetite', category: 'General', weight: 2, is_emergency: 0 },
  { name: 'Severe Confusion', category: 'Neurological', weight: 8, is_emergency: 1 },
  { name: 'Heart Palpitations', category: 'Cardiovascular', weight: 6, is_emergency: 0 }
];

const diseases = [
  { name: 'Common Cold', category: 'Respiratory', severity: 'low', base_score: 10, requires_care: 0 },
  { name: 'Influenza (Flu)', category: 'Respiratory', severity: 'medium', base_score: 40, requires_care: 1 },
  { name: 'COVID-19', category: 'Infectious', severity: 'high', base_score: 60, requires_care: 1 },
  { name: 'Pneumonia', category: 'Respiratory', severity: 'critical', base_score: 80, requires_care: 1 },
  { name: 'Migraine', category: 'Neurological', severity: 'medium', base_score: 30, requires_care: 0 },
  { name: 'Food Poisoning', category: 'Gastrointestinal', severity: 'medium', base_score: 35, requires_care: 0 },
  { name: 'Acute Bronchitis', category: 'Respiratory', severity: 'medium', base_score: 45, requires_care: 1 },
  { name: 'Tension Headache', category: 'Neurological', severity: 'low', base_score: 10, requires_care: 0 },
  { name: 'Gastroenteritis (Stomach Flu)', category: 'Gastrointestinal', severity: 'medium', base_score: 30, requires_care: 0 },
  { name: 'Acute Cardiovascular Distress', category: 'Cardiovascular', severity: 'critical', base_score: 95, requires_care: 1 }
];

const diseaseSymptoms = [
  // Common Cold
  { disease: 'Common Cold', symptom: 'Runny Nose', is_primary: 1, occurrence: 90 },
  { disease: 'Common Cold', symptom: 'Cough', is_primary: 1, occurrence: 80 },
  { disease: 'Common Cold', symptom: 'Sore Throat', is_primary: 1, occurrence: 75 },
  { disease: 'Common Cold', symptom: 'Headache', is_primary: 0, occurrence: 30 },
  { disease: 'Common Cold', symptom: 'Fatigue', is_primary: 0, occurrence: 40 },
  { disease: 'Common Cold', symptom: 'Fever', is_primary: 0, occurrence: 15 },
  
  // Influenza (Flu)
  { disease: 'Influenza (Flu)', symptom: 'Fever', is_primary: 1, occurrence: 95 },
  { disease: 'Influenza (Flu)', symptom: 'Muscle Aches', is_primary: 1, occurrence: 90 },
  { disease: 'Influenza (Flu)', symptom: 'Fatigue', is_primary: 1, occurrence: 85 },
  { disease: 'Influenza (Flu)', symptom: 'Chills', is_primary: 1, occurrence: 80 },
  { disease: 'Influenza (Flu)', symptom: 'Cough', is_primary: 0, occurrence: 65 },
  { disease: 'Influenza (Flu)', symptom: 'Headache', is_primary: 0, occurrence: 60 },
  { disease: 'Influenza (Flu)', symptom: 'Sore Throat', is_primary: 0, occurrence: 50 },

  // COVID-19
  { disease: 'COVID-19', symptom: 'Fever', is_primary: 1, occurrence: 85 },
  { disease: 'COVID-19', symptom: 'Cough', is_primary: 1, occurrence: 80 },
  { disease: 'COVID-19', symptom: 'Loss of Smell or Taste', is_primary: 1, occurrence: 70 },
  { disease: 'COVID-19', symptom: 'Fatigue', is_primary: 0, occurrence: 70 },
  { disease: 'COVID-19', symptom: 'Muscle Aches', is_primary: 0, occurrence: 60 },
  { disease: 'COVID-19', symptom: 'Shortness of Breath', is_primary: 0, occurrence: 45 },
  { disease: 'COVID-19', symptom: 'Sore Throat', is_primary: 0, occurrence: 40 },

  // Pneumonia
  { disease: 'Pneumonia', symptom: 'Cough', is_primary: 1, occurrence: 95 },
  { disease: 'Pneumonia', symptom: 'Shortness of Breath', is_primary: 1, occurrence: 90 },
  { disease: 'Pneumonia', symptom: 'Fever', is_primary: 1, occurrence: 85 },
  { disease: 'Pneumonia', symptom: 'Chest Pain', is_primary: 0, occurrence: 65 },
  { disease: 'Pneumonia', symptom: 'Chills', is_primary: 0, occurrence: 60 },
  { disease: 'Pneumonia', symptom: 'Fatigue', is_primary: 0, occurrence: 70 },

  // Migraine
  { disease: 'Migraine', symptom: 'Headache', is_primary: 1, occurrence: 98 },
  { disease: 'Migraine', symptom: 'Nausea', is_primary: 1, occurrence: 75 },
  { disease: 'Migraine', symptom: 'Dizziness', is_primary: 0, occurrence: 45 },
  { disease: 'Migraine', symptom: 'Vomiting', is_primary: 0, occurrence: 30 },

  // Food Poisoning
  { disease: 'Food Poisoning', symptom: 'Nausea', is_primary: 1, occurrence: 90 },
  { disease: 'Food Poisoning', symptom: 'Vomiting', is_primary: 1, occurrence: 85 },
  { disease: 'Food Poisoning', symptom: 'Diarrhea', is_primary: 1, occurrence: 80 },
  { disease: 'Food Poisoning', symptom: 'Abdominal Pain', is_primary: 1, occurrence: 75 },
  { disease: 'Food Poisoning', symptom: 'Fever', is_primary: 0, occurrence: 35 },
  { disease: 'Food Poisoning', symptom: 'Fatigue', is_primary: 0, occurrence: 50 },

  // Acute Bronchitis
  { disease: 'Acute Bronchitis', symptom: 'Cough', is_primary: 1, occurrence: 95 },
  { disease: 'Acute Bronchitis', symptom: 'Wheezing', is_primary: 1, occurrence: 70 },
  { disease: 'Acute Bronchitis', symptom: 'Fatigue', is_primary: 0, occurrence: 60 },
  { disease: 'Acute Bronchitis', symptom: 'Sore Throat', is_primary: 0, occurrence: 50 },
  { disease: 'Acute Bronchitis', symptom: 'Fever', is_primary: 0, occurrence: 40 },

  // Tension Headache
  { disease: 'Tension Headache', symptom: 'Headache', is_primary: 1, occurrence: 95 },
  { disease: 'Tension Headache', symptom: 'Fatigue', is_primary: 0, occurrence: 40 },
  { disease: 'Tension Headache', symptom: 'Muscle Aches', is_primary: 0, occurrence: 30 },

  // Gastroenteritis
  { disease: 'Gastroenteritis (Stomach Flu)', symptom: 'Diarrhea', is_primary: 1, occurrence: 90 },
  { disease: 'Gastroenteritis (Stomach Flu)', symptom: 'Nausea', is_primary: 1, occurrence: 80 },
  { disease: 'Gastroenteritis (Stomach Flu)', symptom: 'Abdominal Pain', is_primary: 1, occurrence: 70 },
  { disease: 'Gastroenteritis (Stomach Flu)', symptom: 'Vomiting', is_primary: 0, occurrence: 50 },
  { disease: 'Gastroenteritis (Stomach Flu)', symptom: 'Fever', is_primary: 0, occurrence: 40 },

  // Acute Cardiovascular Distress
  { disease: 'Acute Cardiovascular Distress', symptom: 'Chest Pain', is_primary: 1, occurrence: 95 },
  { disease: 'Acute Cardiovascular Distress', symptom: 'Heart Palpitations', is_primary: 1, occurrence: 85 },
  { disease: 'Acute Cardiovascular Distress', symptom: 'Shortness of Breath', is_primary: 1, occurrence: 80 },
  { disease: 'Acute Cardiovascular Distress', symptom: 'Dizziness', is_primary: 0, occurrence: 60 },
  { disease: 'Acute Cardiovascular Distress', symptom: 'Severe Confusion', is_primary: 0, occurrence: 50 }
];

const hospitals = [
  { name: 'City Hospital & Heart Institute', type: 'Multispecialty', address: '12 Circle Road, Kadri', city: 'Mangaluru', pincode: '575001', lat: 12.8797, lng: 74.8433, emergency: 1 },
  { name: 'Medipoint Trauma Care', type: 'Emergency Clinic', address: '45 NH-66 Bypass', city: 'Mangaluru', pincode: '575003', lat: 12.9150, lng: 74.8620, emergency: 1 },
  { name: 'Apollo Spectra Hospital', type: 'Surgical Specialty', address: 'Koramanagla 5th Block', city: 'Bangalore', pincode: '560034', lat: 12.9345, lng: 77.6212, emergency: 1 },
  { name: 'Fortis Hospital', type: 'Multispecialty', address: 'Bannerghatta Main Road', city: 'Bangalore', pincode: '560076', lat: 12.8950, lng: 77.5980, emergency: 1 },
  { name: 'St. John\'s Medical College Hospital', type: 'General & Teaching', address: 'Sarjapur Road', city: 'Bangalore', pincode: '560034', lat: 12.9332, lng: 77.6244, emergency: 1 },
  { name: 'KMC Hospital', type: 'Super Specialty', address: 'Light House Hill Road', city: 'Mangaluru', pincode: '575001', lat: 12.8724, lng: 74.8428, emergency: 1 },
  { name: 'Lilavati Hospital & Research Centre', type: 'Super Specialty', address: 'Bandra West', city: 'Mumbai', pincode: '400050', lat: 19.0510, lng: 72.8258, emergency: 1 },
  { name: 'Kokilaben Dhirubhai Ambani Hospital', type: 'Multispecialty', address: 'Andheri West', city: 'Mumbai', pincode: '400053', lat: 19.1311, lng: 72.8255, emergency: 1 },
  { name: 'All India Institute of Medical Sciences (AIIMS)', type: 'Government General', address: 'Ansari Nagar', city: 'Delhi', pincode: '110029', lat: 28.5672, lng: 77.2100, emergency: 1 },
  { name: 'Max Super Speciality Hospital', type: 'Super Specialty', address: 'Saket', city: 'Delhi', pincode: '110017', lat: 28.5284, lng: 77.2114, emergency: 1 }
];

module.exports = {
  symptoms,
  diseases,
  diseaseSymptoms,
  hospitals
};
