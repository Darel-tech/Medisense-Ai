# MEDISENSE-AI: SYSTEM ARCHITECTURE
## Complete Technical Design & Architecture Documentation

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Database Architecture](#database-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability Considerations](#scalability-considerations)

---

## 1. SYSTEM OVERVIEW

### 1.1 System Purpose
Medisense-AI is a patient health assessment platform demonstrating advanced Database Management System concepts through a full-stack web application.

### 1.2 Core Components
```
┌─────────────────────────────────────────────────────────────┐
│                    MEDISENSE-AI SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │   Frontend   │◄──►│   Backend    │◄──►│  Database   │  │
│  │  React + UI  │    │  Node.js API │    │   MySQL 8   │  │
│  └──────────────┘    └──────────────┘    └─────────────┘  │
│         │                    │                              │
│         │                    ▼                              │
│         │            ┌──────────────┐                       │
│         └───────────►│  Claude AI   │                       │
│                      │   Chatbot    │                       │
│                      └──────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.2.0 | UI Framework |
| | Vite | 5.0.8 | Build Tool |
| | Tailwind CSS | 3.3.6 | Styling |
| | React Router | 6.20.1 | Routing |
| | Axios | 1.6.2 | HTTP Client |
| **Backend** | Node.js | 18+ | Runtime |
| | Express | 4.18.2 | Web Framework |
| | MySQL2 | 3.6.5 | Database Driver |
| | JWT | 9.0.2 | Authentication |
| | bcrypt | 5.1.1 | Password Hashing |
| **Database** | MySQL | 8.0 | Relational DBMS |
| **AI** | Claude API | Latest | Chatbot |
| **Deployment** | Railway | - | Database Hosting |
| | Render | - | Backend Hosting |
| | Vercel | - | Frontend Hosting |

---

## 2. HIGH-LEVEL ARCHITECTURE

### 2.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Single Page Application (SPA)                     │  │
│  │  ├── Components (Login, Dashboard, Assessment, etc.)     │  │
│  │  ├── State Management (React Context)                    │  │
│  │  ├── Routing (React Router)                              │  │
│  │  └── HTTP Client (Axios)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ HTTPS/REST API                     │
│                            ▼                                    │
├─────────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js REST API Server                              │  │
│  │  ├── Authentication Middleware (JWT)                     │  │
│  │  ├── Route Handlers                                      │  │
│  │  │   ├── /api/auth/*        (Login, Register)           │  │
│  │  │   ├── /api/patient/*     (Profile Management)        │  │
│  │  │   ├── /api/assessments/* (Symptom Assessment)        │  │
│  │  │   ├── /api/monitoring/*  (Patient Tracking)          │  │
│  │  │   ├── /api/hospitals/*   (Hospital Finder)           │  │
│  │  │   └── /api/chat/*        (Chatbot Interface)         │  │
│  │  ├── Business Logic                                      │  │
│  │  └── External API Integration (Claude AI)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ MySQL Protocol                     │
│                            ▼                                    │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MySQL 8.0 Relational Database                           │  │
│  │  ├── Tables (11 Normalized Tables)                       │  │
│  │  ├── Triggers (2 Automated Triggers)                     │  │
│  │  ├── Stored Procedures (2 Procedures)                    │  │
│  │  ├── Views (3 Analytical Views)                          │  │
│  │  └── Indexes (Performance Optimization)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 System Interaction Flow

```
User Browser
     │
     │ 1. HTTPS Request
     ▼
React Frontend (Port 5173)
     │
     │ 2. API Call + JWT Token
     ▼
Express Backend (Port 3000)
     │
     ├──► 3a. Verify JWT
     │    (Authentication Middleware)
     │
     ├──► 3b. Execute Business Logic
     │    (Route Handlers)
     │
     └──► 3c. Query Database
          │
          ▼
     MySQL Database
          │
          ├──► Execute Triggers (Automatic)
          ├──► Call Stored Procedures
          └──► Return Results
          │
          ▼
     Express Backend
     │
     │ 4. Format Response (JSON)
     ▼
React Frontend
     │
     │ 5. Render UI
     ▼
User Browser
```

---

## 3. DATABASE ARCHITECTURE

### 3.1 Entity Relationship Diagram (ERD)

```
┌──────────────┐
│    users     │
│──────────────│
│ PK user_id   │
│    email     │
│ password_hash│
│    role      │
│  created_at  │
└──────┬───────┘
       │ 1:1
       │
       ▼
┌──────────────┐         ┌──────────────────┐
│   patients   │         │  symptom_master  │
│──────────────│         │──────────────────│
│ PK patient_id│         │ PK symptom_id    │
│ FK user_id   │         │  symptom_name    │
│  full_name   │         │  category        │
│     age      │         │ severity_weight  │
│    gender    │         │is_emergency_sign │
│   address    │         └─────────┬────────┘
│     city     │                   │
│   pincode    │                   │ M:N
└──────┬───────┘                   │
       │ 1:N                       │
       │                           │
       ▼                           ▼
┌──────────────┐         ┌──────────────────┐
│ assessments  │◄───────►│patient_symptoms  │
│──────────────│   1:N   │──────────────────│
│PK assessment │         │ PK record_id     │
│FK patient_id │         │FK assessment_id  │
│ risk_score   │         │FK symptom_id     │
│ risk_level   │         │severity_rating   │
│   status     │         │ duration_days    │
└──────┬───────┘         └──────────────────┘
       │ 1:1
       │
       ▼
┌──────────────┐         ┌──────────────────┐
│  diagnosis   │         │  disease_master  │
│   _results   │    M:1  │──────────────────│
│──────────────│◄────────│ PK disease_id    │
│PK diagnosis  │         │  disease_name    │
│FK assessment │         │   category       │
│FK disease_id │         │ severity_level   │
│  confidence  │         │  base_score      │
│recommendation│         │ requires_care    │
└──────────────┘         └─────────┬────────┘
                                   │
       ┌───────────────────────────┘
       │ M:N
       │
       ▼
┌──────────────────┐
│disease_symptoms  │
│──────────────────│
│ PK mapping_id    │
│ FK disease_id    │
│ FK symptom_id    │
│ occurrence_%     │
│ is_primary       │
└──────────────────┘

┌──────────────┐         ┌──────────────────┐
│ monitoring   │         │   hospital_      │
│    _logs     │         │   directory      │
│──────────────│         │──────────────────│
│ PK log_id    │         │ PK hospital_id   │
│FK patient_id │         │  hospital_name   │
│FK assessment │         │  hospital_type   │
│  check_date  │         │    address       │
│  improvement │         │     city         │
│alert_trigger │         │   latitude       │
│hospitalize   │         │   longitude      │
└──────────────┘         │  has_emergency   │
                         └──────────────────┘

┌──────────────┐
│  chatbot_    │
│    logs      │
│──────────────│
│ PK chat_id   │
│FK patient_id │
│message_type  │
│message_text  │
│  timestamp   │
└──────────────┘
```

### 3.2 Database Schema Layers

```
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │           BASE TABLES (11 Tables)              │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  Core Tables:                            │ │    │
│  │  │  • users (authentication)                │ │    │
│  │  │  • patients (profiles)                   │ │    │
│  │  │  • assessments (evaluations)             │ │    │
│  │  │  • patient_symptoms (current symptoms)   │ │    │
│  │  │  • diagnosis_results (outcomes)          │ │    │
│  │  │  • monitoring_logs (tracking)            │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  Reference Tables:                       │ │    │
│  │  │  • symptom_master (100 symptoms)         │ │    │
│  │  │  • disease_master (50 diseases)          │ │    │
│  │  │  • disease_symptoms (mappings)           │ │    │
│  │  │  • hospital_directory (facilities)       │ │    │
│  │  │  • chatbot_logs (conversations)          │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                         │                              │
│                         ▼                              │
│  ┌────────────────────────────────────────────────┐    │
│  │        AUTOMATION LAYER (Triggers)             │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  calculate_risk_score                    │ │    │
│  │  │  ├─ Fires: AFTER INSERT patient_symptoms│ │    │
│  │  │  └─ Action: Calculate & update risk     │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  check_monitoring_alert                  │ │    │
│  │  │  ├─ Fires: AFTER INSERT monitoring_logs │ │    │
│  │  │  └─ Action: Check hospitalization need  │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                         │                              │
│                         ▼                              │
│  ┌────────────────────────────────────────────────┐    │
│  │      BUSINESS LOGIC LAYER (Procedures)         │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  complete_patient_assessment()           │ │    │
│  │  │  ├─ Input: assessment_id                 │ │    │
│  │  │  ├─ Process: Match symptoms to diseases  │ │    │
│  │  │  └─ Output: Diagnosis + recommendations │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  find_nearby_hospitals()                 │ │    │
│  │  │  ├─ Input: city, pincode, emergency_flag│ │    │
│  │  │  ├─ Process: Location-based filtering   │ │    │
│  │  │  └─ Output: Top 10 hospitals             │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                         │                              │
│                         ▼                              │
│  ┌────────────────────────────────────────────────┐    │
│  │        REPORTING LAYER (Views)                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  patient_dashboard                       │ │    │
│  │  │  └─ Patient statistics & history         │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  disease_statistics                      │ │    │
│  │  │  └─ Disease occurrence analysis          │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │  active_monitoring                       │ │    │
│  │  │  └─ Real-time monitoring overview        │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Data Normalization

**Database Normal Form: 3NF (Third Normal Form)**

#### Normalization Rules Applied:

**1NF (First Normal Form)**
- ✅ All tables have primary keys
- ✅ No repeating groups (no array columns)
- ✅ Atomic values only

**2NF (Second Normal Form)**
- ✅ All non-key attributes depend on entire primary key
- ✅ No partial dependencies

**3NF (Third Normal Form)**
- ✅ No transitive dependencies
- ✅ Non-key attributes depend only on primary key

#### Example: Patient Information Decomposition

**Before Normalization:**
```sql
patient_info (
    patient_id, email, password, name, age, 
    symptom1, symptom2, symptom3, disease_name, 
    hospital_name, hospital_address
)
-- Problems: Repeating groups, transitive dependencies
```

**After 3NF Normalization:**
```sql
users (user_id, email, password)
patients (patient_id, user_id, name, age)
symptoms (symptom_id, name)
patient_symptoms (assessment_id, symptom_id)
diseases (disease_id, name)
hospitals (hospital_id, name, address)
```

---

## 4. BACKEND ARCHITECTURE

### 4.1 Backend Component Structure

```
backend/
│
├── server.js (Main Entry Point)
│   │
│   ├─► Express App Configuration
│   │   ├── Middleware Setup
│   │   │   ├── CORS
│   │   │   ├── JSON Parser
│   │   │   └── Error Handler
│   │   │
│   │   ├── Database Connection Pool
│   │   │   └── MySQL2 Pool (10 connections)
│   │   │
│   │   └── JWT Configuration
│   │
│   ├─► Route Definitions (15 Endpoints)
│   │   │
│   │   ├── Authentication Routes
│   │   │   ├── POST /api/auth/register
│   │   │   └── POST /api/auth/login
│   │   │
│   │   ├── Patient Routes (Protected)
│   │   │   ├── GET  /api/patient/profile
│   │   │   └── PUT  /api/patient/profile
│   │   │
│   │   ├── Symptom/Disease Routes
│   │   │   ├── GET  /api/symptoms
│   │   │   ├── GET  /api/symptoms/categories
│   │   │   └── GET  /api/diseases
│   │   │
│   │   ├── Assessment Routes (Protected)
│   │   │   ├── POST /api/assessments
│   │   │   ├── GET  /api/assessments
│   │   │   └── GET  /api/assessments/:id
│   │   │
│   │   ├── Monitoring Routes (Protected)
│   │   │   ├── POST /api/monitoring
│   │   │   └── GET  /api/monitoring/:id
│   │   │
│   │   ├── Hospital Routes (Protected)
│   │   │   └── GET  /api/hospitals/nearby
│   │   │
│   │   ├── Dashboard Routes (Protected)
│   │   │   └── GET  /api/dashboard
│   │   │
│   │   └── Chatbot Routes (Protected)
│   │       ├── POST /api/chat
│   │       └── GET  /api/chat/history
│   │
│   └─► Server Initialization
│       └── Listen on Port 3000
│
└── package.json (Dependencies)
```

### 4.2 API Request Lifecycle

```
1. CLIENT REQUEST
   │
   │ POST /api/assessments
   │ Headers: { Authorization: "Bearer <JWT>" }
   │ Body: { symptoms: [...], notes: "..." }
   │
   ▼
2. MIDDLEWARE CHAIN
   │
   ├─► CORS Middleware
   │   └─ Allow origin: localhost:5173
   │
   ├─► JSON Parser
   │   └─ Parse request body
   │
   └─► JWT Authentication
       └─ Verify token validity
       └─ Extract user_id & patient_id
       └─ Attach to req.user
   │
   ▼
3. ROUTE HANDLER
   │
   ├─► Validate Request Data
   │   └─ Check required fields
   │   └─ Validate data types
   │
   ├─► Begin Database Transaction
   │   │
   │   ├─► INSERT into assessments table
   │   │
   │   ├─► INSERT symptoms into patient_symptoms
   │   │   └─ TRIGGER: calculate_risk_score fires
   │   │       └─ Automatically updates risk_level
   │   │
   │   ├─► CALL complete_patient_assessment()
   │   │   └─ Stored procedure executes
   │   │       ├─ Match symptoms to diseases
   │   │       ├─ Calculate confidence score
   │   │       └─ Generate recommendation
   │   │
   │   └─► COMMIT Transaction
   │
   ├─► Fetch Updated Assessment Data
   │
   └─► Format Response
   │
   ▼
4. RESPONSE
   │
   │ Status: 201 Created
   │ Body: {
   │   message: "Assessment completed",
   │   assessment: {
   │     assessment_id: 123,
   │     risk_level: "urgent",
   │     risk_score: 175,
   │     disease_name: "Pneumonia",
   │     confidence: 78.5,
   │     recommendation: "See doctor within 24 hours"
   │   }
   │ }
   │
   ▼
5. CLIENT RECEIVES & RENDERS
```

### 4.3 Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                  REGISTRATION FLOW                       │
└──────────────────────────────────────────────────────────┘

User Input → Email, Password, Profile Data
     │
     ▼
Backend Validation
     │
     ├─► Check: Email unique?
     │   └─ Query: SELECT * FROM users WHERE email = ?
     │
     ├─► Hash Password
     │   └─ bcrypt.hash(password, 10)
     │
     ▼
Database Transaction
     │
     ├─► INSERT INTO users (email, password_hash)
     │
     └─► INSERT INTO patients (user_id, name, age, ...)
     │
     ▼
Generate JWT Token
     │
     └─► jwt.sign({ user_id, email, role }, SECRET, { expiresIn: '7d' })
     │
     ▼
Return: { token, user: { user_id, email, name } }

┌──────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                            │
└──────────────────────────────────────────────────────────┘

User Input → Email, Password
     │
     ▼
Fetch User from Database
     │
     └─► SELECT * FROM users WHERE email = ?
     │
     ▼
Verify Password
     │
     └─► bcrypt.compare(inputPassword, storedHash)
     │
     ▼
Generate JWT Token
     │
     └─► jwt.sign({ user_id, patient_id }, SECRET)
     │
     ▼
Return: { token, user }

┌──────────────────────────────────────────────────────────┐
│              AUTHENTICATED REQUEST FLOW                  │
└──────────────────────────────────────────────────────────┘

Client Request
     │
     └─► Headers: { Authorization: "Bearer <token>" }
     │
     ▼
JWT Middleware
     │
     ├─► Extract token from header
     │
     ├─► Verify token signature
     │   └─► jwt.verify(token, SECRET)
     │
     ├─► Check expiration
     │
     └─► Attach decoded data to req.user
     │
     ▼
Route Handler
     │
     └─► Access req.user.patient_id
```

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Frontend Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                      App.jsx                           │
│                  (Root Component)                      │
│                                                        │
│  ├── AuthContext Provider                             │
│  │   └── Manages: user state, login, logout          │
│  │                                                    │
│  ├── Router (React Router)                            │
│  │   │                                                │
│  │   ├── Public Routes                                │
│  │   │   ├── /login → Login.jsx                      │
│  │   │   └── /register → Register.jsx                │
│  │   │                                                │
│  │   └── Protected Routes (Require Authentication)    │
│  │       │                                            │
│  │       ├── /dashboard → Dashboard.jsx              │
│  │       │   └── Shows: Recent assessments, stats    │
│  │       │                                            │
│  │       ├── /assessment → Assessment.jsx            │
│  │       │   └── Components:                         │
│  │       │       ├── CategorySelector                │
│  │       │       ├── SymptomList                     │
│  │       │       ├── SelectedSymptoms                │
│  │       │       └── DiagnosisResult                 │
│  │       │                                            │
│  │       ├── /monitoring/:id → Monitoring.jsx       │
│  │       │   └── Components:                         │
│  │       │       ├── MonitoringCalendar              │
│  │       │       ├── ProgressChart                   │
│  │       │       └── DailyLogForm                    │
│  │       │                                            │
│  │       └── /profile → Profile.jsx                  │
│  │           └── Forms: Edit patient info            │
│  │                                                    │
│  ├── Navigation.jsx (Top Bar)                         │
│  │   └── Shows when authenticated                    │
│  │                                                    │
│  └── Chatbot.jsx (Floating Widget)                    │
│      └── Available on all authenticated pages        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.2 State Management Architecture

```
┌────────────────────────────────────────────────────────┐
│              STATE MANAGEMENT LAYERS                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │    GLOBAL STATE (React Context)              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  AuthContext                           │  │    │
│  │  │  ├── user: { user_id, email, name }    │  │    │
│  │  │  ├── login(token, userData)            │  │    │
│  │  │  └── logout()                          │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │                                               │    │
│  │  Persisted in:                                │    │
│  │  ├── localStorage.medisense_token            │    │
│  │  └── localStorage.medisense_user             │    │
│  └──────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│  ┌──────────────────────────────────────────────┐    │
│  │    COMPONENT STATE (useState)                │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  Assessment.jsx                        │  │    │
│  │  │  ├── symptoms: []                      │  │    │
│  │  │  ├── selectedCategory: ""              │  │    │
│  │  │  ├── selectedSymptoms: []              │  │    │
│  │  │  ├── diagnosis: null                   │  │    │
│  │  │  └── step: 1                           │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  Dashboard.jsx                         │  │    │
│  │  │  ├── assessments: []                   │  │    │
│  │  │  └── loading: false                    │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  Chatbot.jsx                           │  │    │
│  │  │  ├── messages: []                      │  │    │
│  │  │  ├── input: ""                         │  │    │
│  │  │  └── isOpen: false                     │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.3 Frontend Data Flow

```
┌────────────────────────────────────────────────────────┐
│            SYMPTOM ASSESSMENT FLOW                     │
└────────────────────────────────────────────────────────┘

1. Component Mount
   │
   └─► useEffect → Fetch Categories
       │
       └─► axios.get('/api/symptoms/categories')
           │
           └─► setState: categories

2. User Selects Category
   │
   └─► onClick Handler
       │
       └─► setState: selectedCategory = 'respiratory'
           │
           └─► useEffect Triggers
               │
               └─► axios.get('/api/symptoms?category=respiratory')
                   │
                   └─► setState: symptoms = [...]

3. User Adds Symptoms
   │
   └─► onClick Handler
       │
       └─► setState: selectedSymptoms = [...prev, newSymptom]

4. User Adjusts Severity/Duration
   │
   └─► onChange Handler
       │
       └─► setState: Update specific symptom in array

5. User Submits Assessment
   │
   └─► onSubmit Handler
       │
       ├─► Validate: symptoms.length > 0
       │
       ├─► API Call
       │   │
       │   └─► axios.post('/api/assessments', {
       │         symptoms: selectedSymptoms,
       │         notes: "..."
       │       })
       │
       └─► On Success
           │
           ├─► setState: diagnosis = response.data
           │
           └─► setState: step = 3 (Show Results)

6. Display Diagnosis
   │
   └─► Render Components
       │
       ├─► Risk Badge (color-coded)
       ├─► Disease Name
       ├─► Recommendation
       └─► Action Buttons
```

---

## 6. DATA FLOW DIAGRAMS

### 6.1 Complete User Journey Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│               NEW ASSESSMENT COMPLETE FLOW                     │
└────────────────────────────────────────────────────────────────┘

Browser                 Frontend              Backend              Database
  │                        │                      │                    │
  │  Load Assessment Page  │                      │                    │
  ├───────────────────────►│                      │                    │
  │                        │  GET /api/symptoms   │                    │
  │                        ├─────────────────────►│                    │
  │                        │                      │ SELECT * FROM      │
  │                        │                      │ symptom_master     │
  │                        │                      ├───────────────────►│
  │                        │                      │ ◄──────────────────┤
  │                        │ ◄─────────────────── │  100 symptoms      │
  │  Display Categories    │                      │                    │
  │ ◄──────────────────────┤                      │                    │
  │                        │                      │                    │
  │  User Selects Symptoms │                      │                    │
  ├───────────────────────►│                      │                    │
  │                        │                      │                    │
  │  Submit Assessment     │                      │                    │
  ├───────────────────────►│ POST /api/assessments                     │
  │                        ├─────────────────────►│                    │
  │                        │                      │ BEGIN TRANSACTION  │
  │                        │                      ├───────────────────►│
  │                        │                      │                    │
  │                        │                      │ INSERT assessments │
  │                        │                      ├───────────────────►│
  │                        │                      │                    │
  │                        │                      │ INSERT symptoms    │
  │                        │                      ├───────────────────►│
  │                        │                      │  🔥 TRIGGER FIRES  │
  │                        │                      │  calculate_risk    │
  │                        │                      │  └─ UPDATE risk   │
  │                        │                      │                    │
  │                        │                      │ CALL procedure     │
  │                        │                      │ complete_assessment│
  │                        │                      ├───────────────────►│
  │                        │                      │  ├─ Match disease  │
  │                        │                      │  ├─ Calc confidence│
  │                        │                      │  └─ INSERT result  │
  │                        │                      │                    │
  │                        │                      │ COMMIT             │
  │                        │                      ├───────────────────►│
  │                        │                      │                    │
  │                        │                      │ SELECT assessment  │
  │                        │                      │ with diagnosis     │
  │                        │                      ├───────────────────►│
  │                        │                      │ ◄──────────────────┤
  │                        │ ◄─────────────────── │  Complete data     │
  │  Display Diagnosis     │                      │                    │
  │ ◄──────────────────────┤                      │                    │
  │                        │                      │                    │
  │  [If Emergency/Urgent] │                      │                    │
  │  Find Hospitals Click  │                      │                    │
  ├───────────────────────►│ GET /hospitals/nearby                     │
  │                        ├─────────────────────►│                    │
  │                        │                      │ CALL procedure     │
  │                        │                      │ find_hospitals     │
  │                        │                      ├───────────────────►│
  │                        │                      │ ◄──────────────────┤
  │                        │ ◄─────────────────── │  Top 10 hospitals  │
  │  Display Hospitals     │                      │                    │
  │ ◄──────────────────────┤                      │                    │
  │                        │                      │                    │
```

### 6.2 Monitoring System Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│              7-DAY MONITORING FLOW                             │
└────────────────────────────────────────────────────────────────┘

Day 1: Initial Assessment
    │
    └─► risk_level = "monitor" OR "consult" OR "urgent"
        │
        └─► status = "requires_monitoring"

Day 2-7: Daily Check-ins
    │
    ├─► User enters daily log
    │   │
    │   ├─► symptom_improvement: "worse" | "same" | "improving"
    │   ├─► new_symptoms: text
    │   ├─► temperature: decimal
    │   └─► notes: text
    │
    ├─► POST /api/monitoring
    │   │
    │   └─► INSERT INTO monitoring_logs
    │       │
    │       └─► 🔥 TRIGGER: check_monitoring_alert FIRES
    │           │
    │           ├─► Check: 7+ days monitored?
    │           │   └─► Yes + Still "worse/same"
    │           │       └─► SET hospitalization_recommended = TRUE
    │           │
    │           └─► Check: 2+ consecutive "worse" in 3 days?
    │               └─► Yes
    │                   └─► SET alert_triggered = TRUE

Display on Frontend:
    │
    ├─► Calendar view with status colors
    ├─► Progress chart (trend line)
    └─► Alert banner if hospitalization_recommended
```

### 6.3 Chatbot Integration Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   CHATBOT INTERACTION FLOW                     │
└────────────────────────────────────────────────────────────────┘

User Types Message
    │
    └─► "I have chest pain and shortness of breath"
        │
        ▼
Frontend (Chatbot.jsx)
    │
    ├─► Save user message to state
    │
    ├─► POST /api/chat (Save to DB)
    │   └─► INSERT INTO chatbot_logs (type: 'user')
    │
    └─► Call Claude API Directly from Frontend
        │
        └─► fetch('https://api.anthropic.com/v1/messages', {
              headers: { 'x-api-key': CLAUDE_KEY },
              body: {
                model: 'claude-sonnet-4',
                system: "You are medical AI assistant...",
                messages: [{ role: 'user', content: userMessage }]
              }
            })
            │
            ▼
Claude AI Processing
    │
    ├─► Analyze message for medical keywords
    ├─► Check for emergency symptoms
    └─► Generate appropriate response
        │
        └─► Response: "Chest pain and shortness of breath 
                       are serious symptoms. I recommend using 
                       our assessment tool immediately, and if 
                       symptoms are severe, call emergency 
                       services. Would you like me to guide you 
                       through the assessment?"
        │
        ▼
Frontend Receives Response
    │
    ├─► Add bot message to state
    │
    ├─► POST /api/chat (Save to DB)
    │   └─► INSERT INTO chatbot_logs (type: 'bot')
    │
    └─► Display in chat UI
```

---

## 7. SECURITY ARCHITECTURE

### 7.1 Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Transport Security                             │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  • HTTPS/TLS 1.3 (Production)                      │  │ │
│  │  │  • Certificate: Let's Encrypt (Free SSL)           │  │ │
│  │  │  • HTTP → HTTPS Redirect                           │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 2: Authentication & Authorization                 │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  JWT Token-Based Authentication                    │  │ │
│  │  │  ├── Token Expiry: 7 days                          │  │ │
│  │  │  ├── Algorithm: HS256                              │  │ │
│  │  │  ├── Payload: { user_id, email, role, exp }       │  │ │
│  │  │  └── Verification on every protected route        │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 3: Password Security                              │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  • Algorithm: bcrypt                               │  │ │
│  │  │  • Salt Rounds: 10                                 │  │ │
│  │  │  • Never store plain text                          │  │ │
│  │  │  • Hash Example:                                   │  │ │
│  │  │    $2b$10$abc...xyz (60 characters)               │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 4: SQL Injection Prevention                       │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Parameterized Queries (mysql2)                    │  │ │
│  │  │  ────────────────────────────────────              │  │ │
│  │  │  ❌ Bad: "SELECT * FROM users                      │  │ │
│  │  │          WHERE email = '" + email + "'"           │  │ │
│  │  │                                                    │  │ │
│  │  │  ✅ Good: pool.execute(                            │  │ │
│  │  │          'SELECT * FROM users WHERE email = ?',   │  │ │
│  │  │          [email]                                   │  │ │
│  │  │        )                                           │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 5: CORS Protection                                │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  • Allowed Origin: https://medisense.vercel.app   │  │ │
│  │  │  • Credentials: true                               │  │ │
│  │  │  • Methods: GET, POST, PUT, DELETE                 │  │ │
│  │  │  • Headers: Content-Type, Authorization           │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 6: Input Validation                               │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  • Server-side validation (required)               │  │ │
│  │  │  • Type checking                                   │  │ │
│  │  │  • Length limits                                   │  │ │
│  │  │  • Sanitization (trim, escape)                     │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Layer 7: Database Access Control                        │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  • Principle of Least Privilege                    │  │ │
│  │  │  • User can only access their own data             │  │ │
│  │  │  • WHERE patient_id = req.user.patient_id          │  │ │
│  │  │  • Foreign Key Constraints (CASCADE deletes)       │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Flow Security

```
Registration Security Checklist:
    ✅ Email validation (format check)
    ✅ Password minimum length (8 characters)
    ✅ Duplicate email check
    ✅ Password hashing (bcrypt, salt rounds: 10)
    ✅ Transaction rollback on error
    ✅ No password in response

Login Security Checklist:
    ✅ Timing-safe password comparison
    ✅ Failed login doesn't reveal if email exists
    ✅ JWT token generation with expiry
    ✅ Token includes minimal data (no password)
    ✅ Update last_login timestamp

Protected Route Security:
    ✅ Token verification on every request
    ✅ Token expiry check
    ✅ User ID from token, not request body
    ✅ Authorization check (owns the resource)
```

---

## 8. DEPLOYMENT ARCHITECTURE

### 8.1 Production Deployment Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     INTERNET (Public)                          │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│   Vercel CDN  │    │  Render.com    │    │ Railway.app  │
│   (Frontend)  │    │   (Backend)    │    │  (Database)  │
├───────────────┤    ├────────────────┤    ├──────────────┤
│ • React App   │    │ • Node.js      │    │ • MySQL 8    │
│ • Static      │    │ • Express      │    │ • 500MB      │
│ • Auto SSL    │    │ • Auto Deploy  │    │ • Backups    │
│ • Global CDN  │    │ • Health Check │    │ • Monitoring │
│ • Free Tier   │    │ • Free Tier    │    │ • Free Tier  │
└───────┬───────┘    └────────┬───────┘    └──────┬───────┘
        │                     │                    │
        │ HTTPS API Calls     │ MySQL Protocol     │
        └────────────────────►│◄───────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌──────────────────┐
                    │  Anthropic API   │
                    │  (Claude AI)     │
                    ├──────────────────┤
                    │ • Chatbot        │
                    │ • Free Tier      │
                    │ • 50 req/day     │
                    └──────────────────┘

Environment Variables Flow:
    Frontend (Vercel)           Backend (Render)           Database (Railway)
    ├── VITE_API_URL            ├── DB_HOST                ├── MYSQL_ROOT_PASSWORD
    └── VITE_CLAUDE_API_KEY     ├── DB_USER                ├── MYSQL_DATABASE
                                ├── DB_PASSWORD            └── PORT: 3306
                                ├── DB_NAME
                                ├── JWT_SECRET
                                └── PORT: 3000
```

### 8.2 Deployment Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                   CI/CD DEPLOYMENT FLOW                        │
└────────────────────────────────────────────────────────────────┘

Developer Machine
    │
    ├─► git add .
    ├─► git commit -m "feat: Add monitoring alerts"
    └─► git push origin main
        │
        ▼
GitHub Repository
    │
    ├─► Triggers Webhooks
    │
    ├───────────────────────┬───────────────────────┐
    │                       │                       │
    ▼                       ▼                       ▼
Vercel Deploy          Render Deploy          (Manual)
    │                       │                Railway Database
    ├─► Detect Changes      ├─► Pull Code          │
    ├─► npm install         ├─► npm install        ├─► Import Schema
    ├─► npm run build       ├─► npm start          └─► Seed Data
    ├─► Deploy to CDN       └─► Health Check
    └─► Live in 30s              │
                                 └─► Live in 2min

Rollback Strategy:
    Vercel: Previous deployments preserved → One-click rollback
    Render: Git-based → Revert commit → Auto redeploy
    Database: Daily backups → Manual restore if needed
```

### 8.3 Monitoring & Health Checks

```
┌────────────────────────────────────────────────────────────────┐
│                 PRODUCTION MONITORING                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Frontend Monitoring (Vercel):                                 │
│  ├── Build Status Dashboard                                    │
│  ├── Deployment Logs                                           │
│  ├── Analytics (Page views, Load time)                         │
│  └── Error Tracking (Runtime errors)                           │
│                                                                │
│  Backend Monitoring (Render):                                  │
│  ├── Health Check Endpoint: GET /api/health                    │
│  │   └── Returns: { status: "healthy", database: "connected" }│
│  ├── Auto-restart on crash                                     │
│  ├── CPU/Memory Usage                                          │
│  └── Request Logs                                              │
│                                                                │
│  Database Monitoring (Railway):                                │
│  ├── Connection Pool Status                                    │
│  ├── Query Performance                                         │
│  ├── Storage Usage (500MB limit)                               │
│  └── Automated Backups (Daily)                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. SCALABILITY CONSIDERATIONS

### 9.1 Current Limitations & Solutions

```
┌────────────────────────────────────────────────────────────────┐
│               SCALABILITY ROADMAP                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Current (Free Tier):                                          │
│  ├── Database: 500MB storage                                   │
│  ├── Backend: Single instance                                  │
│  ├── API: No rate limiting                                     │
│  └── Suitable for: 100-500 users                               │
│                                                                │
│  Phase 1 (Paid Tier ~$20/month):                               │
│  ├── Database: Upgrade to 10GB                                 │
│  ├── Backend: Add rate limiting                                │
│  ├── Caching: Redis for symptoms/diseases                      │
│  └── Capacity: 5,000 users                                     │
│                                                                │
│  Phase 2 (Growth ~$100/month):                                 │
│  ├── Database: Read replicas                                   │
│  ├── Backend: Horizontal scaling (3 instances)                 │
│  ├── CDN: Cloudflare for assets                                │
│  └── Capacity: 50,000 users                                    │
│                                                                │
│  Phase 3 (Enterprise ~$500/month):                             │
│  ├── Database: Sharding by region                              │
│  ├── Backend: Load balancer + Auto-scaling                     │
│  ├── Monitoring: DataDog/New Relic                             │
│  └── Capacity: 500,000+ users                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Performance Optimization Strategies

```
Database Optimization:
    ├── Indexes on frequently queried columns
    ├── Composite indexes for multi-column WHERE
    ├── Query result caching (Redis)
    ├── Connection pooling (already implemented)
    └── Avoid SELECT * (specify columns)

Backend Optimization:
    ├── Response compression (gzip)
    ├── API response caching
    ├── Pagination for list endpoints
    ├── Async processing for heavy tasks
    └── Rate limiting per user

Frontend Optimization:
    ├── Code splitting (React.lazy)
    ├── Image optimization
    ├── Lazy loading components
    ├── Service Worker (PWA)
    └── Bundle size reduction
```

---

## 10. CONCLUSION

### Technology Decisions Summary

| Decision | Reason |
|----------|--------|
| **MySQL** | Required by project, mature trigger/procedure support |
| **Node.js + Express** | Fast development, JSON-native, large ecosystem |
| **React + Vite** | Modern, fast builds, component reusability |
| **JWT Authentication** | Stateless, scalable, industry standard |
| **bcrypt** | Industry standard for password hashing |
| **Railway + Render + Vercel** | Free tier, easy deployment, reliable |

### Architecture Strengths

✅ **Clear Separation of Concerns** (3-tier architecture)  
✅ **Database-Driven Logic** (Triggers, procedures showcase DBMS)  
✅ **Secure by Design** (JWT, bcrypt, parameterized queries)  
✅ **Scalable Foundation** (Can grow from prototype to production)  
✅ **Modern Stack** (Industry-relevant technologies)  

### Future Enhancements

- **Caching Layer**: Redis for frequently accessed data
- **Message Queue**: Background jobs for notifications
- **Microservices**: Split into assessment, monitoring, chatbot services
- **GraphQL**: Alternative API for complex queries
- **WebSockets**: Real-time monitoring updates

---

**This architecture supports the current DBMS demonstration while providing a path to production-scale deployment.**