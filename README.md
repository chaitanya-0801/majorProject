# AttendEase 📍✅

AttendEase is a smart attendance management system designed for educational institutions. It allows teachers to create attendance sessions while enabling students to mark their attendance securely using real-time geolocation verification.

The system ensures that attendance can only be marked when a student is physically present within the allowed radius set by the teacher, reducing proxy attendance and improving authenticity.

---

# 🚀 Features

## 👨‍🏫 Teacher Features
- Create attendance sessions
- Set session location and attendance radius
- View student attendance records
- Manage multiple sessions
- Secure login and authentication

## 👨‍🎓 Student Features
- Join attendance sessions
- Mark attendance using current location
- Real-time geolocation verification
- Attendance confirmation status
- User-friendly dashboard

## 📍 Geolocation Based Attendance
AttendEase uses the device's GPS location to verify whether the student is within the allowed radius of the session location.

If the student is:
- ✅ Inside the radius → Attendance marked as **Present**
- ❌ Outside the radius → Attendance marking denied

This helps prevent fake or proxy attendance.

---

# 🛠️ Tech Stack

## Frontend
- React.js
- CSS
- Axios

## Backend
- Node.js
- Express.js

## Database
- MongoDB

## Authentication
- JWT / Cookies Authentication

## Other Technologies
- Geolocation API
- REST APIs

---

# 📂 Project Structure

```bash
AttendEase/
│
├── client/         # Frontend
├── server/         # Backend
├── models/         # Database Models
├── routes/         # API Routes
├── controllers/    # Business Logic
├── middleware/     # Authentication Middleware
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/AttendEase.git
```

## 2️⃣ Navigate to Project Folder

```bash
cd AttendEase
```

## 3️⃣ Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the server folder and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

---

# ▶️ Running the Project

## Start Backend

```bash
cd server
npm start
```

## Start Frontend

```bash
cd client
npm start
```

---

# 🌍 How Attendance Verification Works

1. Teacher creates a session
2. Session stores:
   - Latitude
   - Longitude
   - Allowed Radius
3. Student opens the attendance page
4. Browser requests current location
5. System calculates distance between:
   - Teacher's session location
   - Student's current location
6. Attendance is marked only if the student is inside the allowed radius

---

# 🔒 Security Features

- JWT Authentication
- Protected Routes
- Secure Attendance Validation
- Geolocation Verification
- Session-based Access Control

---

# 📸 Future Improvements

- QR Code Based Attendance
- Face Recognition Integration
- Attendance Analytics Dashboard
- Mobile Application
- Live Session Tracking
- Email Notifications

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Create a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Developed by Chaitanya 🚀
