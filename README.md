# AttendEase 📍🎓
### Smart Attendance and AI-Based Personalized Curriculum Planning System

AttendEase is an enterprise-grade educational technology platform that pairs **secure, geofenced, biometric-assisted attendance verification** with an **AI-powered personalized curriculum planning engine**.

The platform ensures authenticated classroom attendance using high-accuracy GPS geofencing, live webcam photograph capture, and expiring cryptographic QR codes, while analyzing student assessment outcomes to diagnose learning gaps, track syllabus mastery, and generate explainable, adaptive study plans.

---

## 🚀 Key Features

### 👨‍🏫 1. Faculty / Teacher Workspace
- **Smart Attendance Sessions:** Create lecture sessions with configurable allowed radius (50m, 75m, 100m, 150m) and duration.
- **Dynamic Expiring QR Codes:** Displays QR codes containing short-lived cryptographic tokens to prevent proxy link sharing.
- **Session Lifecycle Controls:** Start, pause, resume, and terminate attendance sessions in real time.
- **Live Attendance Dashboard:** View student submissions in real time with distance metrics, IP addresses, and live webcam verification photos.
- **Attendance Corrections & Audit Trail:** Correct attendance records (Present, Late, Excused, Rejected) with mandatory compliance explanations permanently stored in the audit log.
- **One-Click CSV Export:** Export complete session attendance records directly to CSV.
- **Curriculum & Syllabus Management:** Organize course syllabi into units and topics with defined learning objectives, prerequisites, and difficulty levels.
- **Diagnostic Assessments:** Create quizzes and tests mapped directly to syllabus topics.
- **Cohort Learning Gap Insights:** Review class-wide conceptual bottlenecks with AI-generated instructional recommendations.

### 👨‍🎓 2. Student Learning & Attendance Portal
- **One-Click Geofenced Attendance:** Verify physical presence inside the classroom using device GPS coordinates and live webcam capture.
- **Distance Verification Feedback:** Instant verification outcome with exact calculated distance from the instructor.
- **Attendance Hub & Shortage Alerts:** Monitor subject-wise attendance percentages with automated warnings when standing falls below the institutional 75% threshold.
- **AI Personalized Weekly Study Plan:** Receive adaptive study roadmaps prioritizing identified learning gaps, with transparent explanations of why each topic was recommended based on assessment scores.
- **Interactive Learning Activities:** Check off recommended readings, coding exercises, and conceptual walkthroughs.
- **Interactive Practice Quizzes:** Test conceptual understanding directly within the study plan, with instant answer validation and pedagogical explanations.
- **Syllabus Coverage Tracking:** Visualize topic-level mastery (Mastered, Proficient, Needs Improvement, Critical Gap) against the institutional syllabus.

### 🛡️ 3. Security, Privacy & Administration
- **Initial Administrator Account Seeding:** Dedicated idempotent CLI and runtime script (`npm run seed:admin`) that securely seeds the institutional administrator account with bcrypt hashing and environment variable configuration (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), while strictly prohibiting public self-registration with the `admin` role.
- **Unique Academic Class Codes:** Standardized cohort codes (e.g., `4CSEA`, `3CSEA`, `3CSEB`, `3ITA`, `2CSEA`, `1CSEA`) normalized to trimmed uppercase, with instant validation via `GET /classes/lookup/:code` and automated enrollment into class subjects.
- **Class-Specific Live Attendance Sessions:** Active lecture sessions are automatically routed to enrolled students' dashboards (with subject, teacher, start time, remaining duration, and direct one-click "Mark Attendance" action). Non-enrolled students are barred from discovery and attendance submission.
- **Server-Side Distance Validation:** Enforces the Haversine mathematical distance formula on the server (`distance <= allowed_radius`).
- **Cryptographic Expiring QR Tokens:** Signed JWT tokens with short expiration prevent unauthorized redistribution.
- **Duplicate Prevention:** Enforced unique compound database indexes (`{ session_id, student_email }`).
- **Bcrypt Password Security:** Server-side salted password hashing with transparent, zero-downtime migration for legacy accounts.
- **Institutional Role-Based Access Control (RBAC):** Distinct permissions for Students, Faculty, and Administrators.
- **Audit Registry:** Permanent logging of administrative operations and attendance corrections.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Design System:** Minimalist Educational SaaS Design System (`ModernTheme.css`)
- **HTTP Client:** Axios
- **QR Code Rendering:** QRCode.react

### Backend
- **Runtime:** Node.js (v22 LTS compatible)
- **Framework:** Express.js (ES Modules)
- **Database:** MongoDB & Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt.js
- **Security:** Helmet & Express Rate Limit
- **File & Image Processing:** Multer & Cloudinary (with local static storage fallback)
- **Email Service:** Nodemailer (with development fallback)
- **AI Integration:** Google Gemini 2.5 Flash API (`@google/genai`) with Deterministic Syllabus-Aligned Pedagogical Engine fallback

---

## 📁 Repository Structure

```
AttendEase/
├── backend/
│   ├── controllers/
│   │   ├── ClassController.js         # Unique class codes, lookup & subject mappings
│   │   ├── CurriculumController.js    # Courses, assessments, analytics & Gemini AI assistant
│   │   ├── SessionController.js       # Geofenced sessions, QR codes, class discovery & CSV
│   │   └── UserController.js          # Authentication, bcrypt, OTP & class reassignment
│   ├── middleware/
│   │   ├── JWT.js                     # Token extraction, role guard & expiring QR tokens
│   │   ├── Mailer.js                  # Email OTP dispatcher
│   │   ├── cloudinary.js              # Resilient photo proof uploader
│   │   └── multer.js                  # Secure multipart image storage
│   ├── model/
│   │   ├── Assessment.js              # Diagnostic quizzes mapped to topics
│   │   ├── AssessmentResult.js        # Student assessment scores & topic breakdown
│   │   ├── AttendanceRecord.js        # Verified student attendance records & audit log
│   │   ├── AttendanceSession.js       # Lecture sessions with class_code & geofence parameters
│   │   ├── AuditLog.js                # System audit trail
│   │   ├── Class.js                   # Unique class codes (4CSEA), subjects & academic year
│   │   ├── Course.js                  # Syllabi, units, topics & learning objectives
│   │   ├── Student.js                 # Student user model with authoritative class_code & roll no
│   │   ├── StudentLearningProfile.js  # Learning gaps, strengths & active study plans
│   │   └── Teacher.js                 # Faculty model & legacy session array
│   ├── routes/
│   │   ├── ClassRoutes.js             # Class management & /lookup/:code
│   │   ├── CurriculumRoutes.js        # Curriculum, assessment & AI assistant endpoints
│   │   ├── SessionRoutes.js           # Attendance & class-specific live session endpoints
│   │   └── userRoutes.js              # Auth & student cohort management endpoints
│   ├── scripts/
│   │   └── seedAdmin.js               # Idempotent administrator seeding script
│   ├── services/
│   │   ├── AcademicAnalyticsService.js # Deterministic metrics, 75% rule math & gap detection
│   │   └── AiCurriculumService.js     # Gemini 2.5 Flash AI & deterministic pedagogical engine
│   ├── test/
│   │   └── attendance-and-ai.test.js  # 15 automated backend verification tests
│   ├── app.js                         # Express application entry point & DB connect hook
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.js      # Campus classes, cohort management & governance
│   │   │   ├── AICurriculumAssistant.js # Gemini 2.5 conversational AI academic advisor
│   │   │   ├── ForgotPassword.js      # Password reset with email verification code
│   │   │   ├── HomeLayout.js          # Top-level router layout with integrated Nav
│   │   │   ├── Landing.js             # SaaS landing page & feature highlights
│   │   │   ├── Login.js               # Sign in with role-based routing
│   │   │   ├── Logout.js              # Session termination
│   │   │   ├── Nav.js                 # Dynamic role-based navigation bar
│   │   │   ├── NewSession.js          # Session creation with class code & GPS geofencing
│   │   │   ├── SessionDetails.js      # Live attendance records, photo proof & corrections
│   │   │   ├── Signup.js              # Student registration with real-time class code verification
│   │   │   ├── StudentDashboard.js    # Student overview, live classes, 75% math & study plan
│   │   │   ├── StudentForm.js         # Camera photo capture & GPS distance validation
│   │   │   ├── TeacherDashboard.js    # Faculty workspace (live classes, curriculum, analytics)
│   │   │   └── UserDetails.js         # Profile modal with inline editing
│   │   ├── styles/
│   │   │   └── ModernTheme.css        # Centralized modern educational SaaS stylesheet
│   │   ├── App.js                     # Route configurations
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js:** v18, v20, or v22 LTS
- **Package Manager:** npm
- **Database:** MongoDB instance (MongoDB Atlas connection string or local MongoDB)

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5050
   DB_URI="your_mongodb_connection_string"
   JWT_SECRET="your_secure_jwt_secret"
   CLIENT_URL="http://localhost:3000"
   GEMINI_API_KEY="your_optional_gemini_api_key"
   ADMIN_EMAIL="admin@institution.edu"
   ADMIN_PASSWORD="AdminSecurePassword2026!"
   ADMIN_NAME="System Administrator"
   ADMIN_PHONE="9999999999"
   ADMIN_ID="ADMIN001"
   EMAIL="your_email@gmail.com"
   PASSWORD="your_app_password"
   ```
4. Seed the initial Administrator Account & Core Institutional Classes (Idempotent):
   ```bash
   npm run seed:admin
   ```
5. Run automated tests (15 test suites):
   ```bash
   npm test
   ```
6. Start backend development server:
   ```bash
   npm run dev
   # or for production
   npm start
   ```

### 3. Frontend Setup
1. Open a terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5050
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Start development server:
   ```bash
   npm start
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 🧪 Verification & Automated Testing

The backend includes 15 automated test suites verifying:
- **Haversine Distance & Geofencing:** Out-of-radius rejection and boundary tolerance.
- **Signed Expiring QR Tokens:** JWT signatures, expiry, and tampering detection.
- **Bcrypt Password Security:** Hashing and verification.
- **Academic 75% Rule Engine:** Consecutive recovery sessions and safe miss calculations.
- **Student Roll Number Protection:** Unalterable database-derived roll numbers.
- **Class Enrollment Enforcement:** Rejection of non-enrolled students.
- **Class-Specific Live Attendance Discovery:** Students discover active sessions belonging exclusively to their registered class (`4CSEA`), with live `Active - Pending` and `Marked` states.
- **Administrator Seeding Idempotency:** Password hash preservation and prohibition of public admin registration.
- **Unique Class Codes Normalization:** Capitalization, character rules, and `GET /classes/lookup/:code`.
- **Student Registration Class Validation:** Mandatory active class code and automatic subject enrollment.
- **AI Curriculum Study Plan Generator:** Pedagogical explainability and structure.

Execute tests via:
```bash
cd backend
npm test
```

---

## 📄 License
This project is licensed under the MIT License.
