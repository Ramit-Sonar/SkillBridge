# 🌉 SkillBridge

### Student Micro-Work Platform for Learning While Earning and Industry Readiness

<p align="center">
  <strong>Bridging the gap between academic learning and real-world industry experience.</strong>
</p>

<p align="center">
  <a href="https://skill-bridge-hazel-rho.vercel.app/">
    <img src="https://img.shields.io/badge/🌐%20LIVE%20DEMO-Visit%20SkillBridge-2563EB?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-000000?style=flat-square" alt="Deployment">
  <img src="https://img.shields.io/badge/API-REST-0EA5E9?style=flat-square" alt="REST API">
  <img src="https://img.shields.io/badge/Authentication-JWT-F59E0B?style=flat-square" alt="JWT">
</p>

---

## 🚀 Live Demo

<p align="center">
  <a href="https://skill-bridge-hazel-rho.vercel.app/">
    <strong>🌐 Open SkillBridge</strong>
  </a>
</p>

**Production Frontend:**
https://skill-bridge-hazel-rho.vercel.app/

---

# 📖 About SkillBridge

**SkillBridge** is a web-based student micro-work platform designed to bridge the gap between **academic knowledge and practical industry experience**.

The platform connects **students looking for practical experience** with **clients who need work completed**.

Students can discover opportunities, apply for jobs, complete projects, communicate with clients, receive feedback, and build a project-based professional profile.

Clients can post jobs, review applications, select suitable students, manage projects, communicate with assigned students, review submissions, and provide feedback.

### 💡 Core Idea

> **Learn → Work → Build Experience → Get Verified → Grow**

---

# 🎯 Problem Statement

Students often have theoretical knowledge but limited opportunities to gain practical industry experience.

Some common problems are:

* 📚 Limited real-world project experience
* 💼 Difficulty finding suitable practical work
* 📝 Lack of verifiable work history
* 🤝 Limited opportunities to work directly with clients
* 🔍 Difficulty demonstrating practical skills
* ⭐ Lack of structured project feedback

SkillBridge provides a structured platform where students can **gain practical experience while building their professional portfolio**.

---

# 💡 Our Solution

SkillBridge creates a structured workflow between students and clients:

```text
Client Posts Job
       ↓
Students Browse Jobs
       ↓
Student Applies
       ↓
Client Reviews Applications
       ↓
Application Accepted
       ↓
Project Workspace Created
       ↓
Student & Client Collaborate
       ↓
Project Completed
       ↓
Client Reviews Work
       ↓
Rating & Feedback
       ↓
Student Builds Work History
```

---

# ✨ Key Features

### 🎯 Student-Client Matching

Connect students with suitable micro-work opportunities through skills, job requirements, and applications.

### 🛡️ Verified Profiles

Build trust through student profiles, skills, certificates, reviews, and project-based skill verification.

### 🤝 Project Collaboration

Manage project work, progress, deliverables, and client-student communication through a dedicated project workspace.

### 💬 Project Discussion

Allow assigned students and clients to communicate within the project workspace through project-based messaging.

### 📊 Project Tracking

Track project status, progress, deliverables, submissions, and completion throughout the project lifecycle.

### 🚨 Reporting System

Allow users to report inappropriate jobs, users, applications, or other platform-related issues for administrative review.

---

# 👥 User Roles

## 🎓 Student

Students can:

* Create and manage profiles
* Add skills
* Upload certificates
* Browse jobs
* Search and filter opportunities
* Apply for jobs
* Track applications
* Manage assigned projects
* Communicate with clients
* Submit project work
* Receive reviews and ratings
* Build project-based work history
* Earn skill verification through completed work
* Report inappropriate content or users

---

## 💼 Client

Clients can:

* Create and manage profiles
* Post jobs
* Define required skills
* View applications
* Review applicants
* Accept suitable students
* Manage projects
* Communicate with assigned students
* Review project submissions
* Provide ratings and feedback
* Report inappropriate content or users

---

## 🛡️ Admin

Administrators can:

* Manage users
* Monitor jobs
* Manage reported issues
* Manage administrative operations

---

# 🧩 Core Modules

```text
SkillBridge
│
├── 🔐 Authentication
│   ├── Registration
│   ├── Login
│   ├── Email Verification
│   ├── Password Reset
│   └── Role-Based Access
│
├── 👤 User Management
│   ├── Student Profile
│   ├── Client Profile
│   ├── Skills
│   └── Certificates
│
├── 💼 Job Management
│   ├── Create Job
│   ├── Browse Jobs
│   ├── Search
│   ├── Filtering
│   └── Job Details
│
├── 📝 Application Management
│   ├── Apply for Job
│   ├── View Applications
│   ├── Accept Application
│   └── Application Status
│
├── 📁 Project Management
│   ├── Project Workspace
│   ├── Project Overview
│   ├── Deliverables
│   ├── Progress
│   └── Project Completion
│
├── 💬 Project Discussion
│   ├── Client-Student Messages
│   ├── Message Storage
│   ├── Authorization
│   └── Polling-Based Updates
│
├── ⭐ Reviews & Ratings
│   ├── Project Feedback
│   └── Student Reputation
│
├── 🚨 Reporting
│   ├── Submit Report
│   ├── Report Management
│   └── Admin Review
│
└── 👨‍💼 Administration
    ├── User Management
    ├── Job Management
    └── Platform Monitoring
```

---

# 🏗️ System Architecture

SkillBridge follows a **three-tier web application architecture** consisting of the presentation layer, application layer, and data layer.

```text
                    ┌─────────────────────────┐
                    │         USERS           │
                    │ Student / Client / Admin│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    PRESENTATION LAYER   │
                    │                         │
                    │ React + TypeScript      │
                    │ Tailwind CSS             │
                    │ React Router             │
                    └────────────┬────────────┘
                                 │
                              REST API
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    APPLICATION LAYER    │
                    │                         │
                    │ Node.js + Express.js    │
                    │ Controllers             │
                    │ Services                │
                    │ Middleware              │
                    │ Authentication          │
                    │ Business Logic           │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       DATA LAYER        │
                    │                         │
                    │ MongoDB + Mongoose      │
                    │                         │
                    │ Users                   │
                    │ Jobs                    │
                    │ Applications            │
                    │ Projects                │
                    │ Messages                │
                    │ Reviews                 │
                    │ Reports                 │
                    │ Certificates            │
                    └─────────────────────────┘
```

### External Services

The backend also communicates with external services for specific functionality:

```text
                    ┌─────────────────────┐
                    │   Express Backend   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          MongoDB Atlas    Cloudinary    Email Service
           Database        File Storage    Nodemailer
```

---

# ☁️ Deployment Architecture

The application is deployed using separate frontend and backend environments.

```text
                         🌐 USERS
                    Student / Client / Admin
                              │
                            HTTPS
                              ▼
                    ┌──────────────────┐
                    │      VERCEL      │
                    │    FRONTEND      │
                    │                  │
                    │ React            │
                    │ TypeScript       │
                    │ Tailwind CSS     │
                    │ Vite             │
                    └────────┬─────────┘
                             │
                       HTTPS REST API
                             ▼
                    ┌──────────────────┐
                    │      RENDER      │
                    │     BACKEND      │
                    │                  │
                    │ Node.js          │
                    │ Express.js       │
                    │ REST API         │
                    │ Business Logic   │
                    └───────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌───────────┐ ┌───────────┐ ┌─────────────┐
        │ MongoDB   │ │ Cloudinary│ │   Email     │
        │   Atlas   │ │   Storage │ │   Service   │
        │           │ │           │ │  Nodemailer │
        └───────────┘ └───────────┘ └─────────────┘
```

### Deployment Components

| Component       | Technology    | Purpose                              |
| --------------- | ------------- | ------------------------------------ |
| 🎨 Frontend     | Vercel        | Hosts React application              |
| ⚙️ Backend      | Render        | Hosts Node.js/Express API            |
| 🗄️ Database    | MongoDB Atlas | Stores application data              |
| ☁️ File Storage | Cloudinary    | Stores uploaded files/images         |
| 📧 Email        | Nodemailer    | Verification and email communication |

---

# 🔐 Authentication & Authorization

SkillBridge uses token-based authentication and role-based authorization.

### Authentication Flow

```text
User
 ↓
Login Form
 ↓
Fetch API
 ↓
Express API
 ↓
Find User
 ↓
Password Verification
 ↓
Generate Authentication Token
 ↓
Authentication Cookie
 ↓
Protected API Requests
 ↓
JWT Verification Middleware
 ↓
Authorized Controller
```

### Authorization

Authentication determines:

> **Who is the user?**

Authorization determines:

> **What is the user allowed to access?**

For example:

```text
Student → Student Features
Client  → Client Features
Admin   → Administrative Features
```

The backend also validates authorization so frontend UI restrictions are not treated as the only security mechanism.

---

# 📧 Email Verification

The registration process uses email verification.

```text
Registration
     ↓
Generate OTP
     ↓
Nodemailer
     ↓
Email Service
     ↓
User Receives OTP
     ↓
Enter OTP
     ↓
Verify OTP
     ↓
Account Verification
```

Email functionality can also be used for password-reset related communication.

---

# 📁 File Upload

Uploaded files are handled using the backend and external cloud storage.

```text
User
 ↓
React Frontend
 ↓
multipart/form-data
 ↓
Multer
 ↓
Express Backend
 ↓
Cloudinary
 ↓
File URL / Metadata
 ↓
MongoDB
```

This approach keeps large media files outside the main application database.

---

# 💬 Project Discussion & Messaging

Project Discussion is available within the project workspace for the assigned student and client.

```text
Student / Client
       ↓
Project Workspace
       ↓
Message Component
       ↓
Fetch API
       ↓
REST API
       ↓
MongoDB
       ↓
Message Response
       ↓
Frontend
```

The current implementation uses **Socket.IO** for real-time message updates.

### Socket.IO Flow

```text
Project Discussion Opens
        ↓
Fetch Messages
        ↓
Connect Socket.IO
        ↓
Join Project Message Room
        ↓
Send Message / Attachment through REST API
        ↓
Save in MongoDB
        ↓
Emit Socket.IO Event to Project Room
        ↓
Student and Client UIs Update
        ↓
Read Receipt Emits When Message Is Marked Read
```

Message attachments are uploaded with the existing multipart upload pipeline and saved as attachment metadata on the message document.

### Local and Production Socket Setup

```text
Local frontend
        ↓
http://localhost:3000 Socket.IO server
```

```text
Production frontend
        ↓
VITE_SOCKET_URL, or same-origin /socket.io rewrite
        ↓
Production backend Socket.IO server
```

---

# 🚨 Reporting System

SkillBridge includes a reporting workflow that allows users to report inappropriate or problematic platform activity.

```text
User
 ↓
Submit Report
 ↓
Backend Validation
 ↓
MongoDB
 ↓
Admin Dashboard
 ↓
Admin Reviews Report
 ↓
Administrative Action
```

Reports can help administrators monitor and manage problematic users, jobs, applications, or other platform activities.

---

# 🔄 Project Lifecycle

```text
┌──────────────────┐
│ Client Posts Job │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Student Applies  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Client Reviews   │
│ Applications     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Application      │
│ Accepted         │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Project Created  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Project Workspace│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Collaboration &  │
│ Project Discussion│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Project Completed│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Review & Rating  │
└──────────────────┘
```

---

# 🛠️ Technology Stack

## 🎨 Frontend

| Technology       | Purpose                    |
| ---------------- | -------------------------- |
| ⚛️ React         | Component-based UI         |
| 🔷 TypeScript    | Static type checking       |
| 🎨 Tailwind CSS  | Responsive styling         |
| 🧭 React Router  | Client-side routing        |
| 🌐 Fetch API     | REST API communication     |
| ⚡ Vite           | Development and build tool |
| 🎬 Framer Motion | UI animations              |
| 🖼️ Lucide React | Interface icons            |

---

## ⚙️ Backend

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| 🟢 Node.js         | Server-side JavaScript runtime |
| 🚂 Express.js      | REST API framework             |
| 🍃 Mongoose        | MongoDB ODM                    |
| 🔐 JWT             | Authentication                 |
| 🔒 bcrypt/bcryptjs | Password hashing               |
| 🍪 Cookie Parser   | Cookie handling                |
| 📁 Multer          | File upload handling           |
| 📧 Nodemailer      | Email communication            |
| 🌱 dotenv          | Environment variables          |
| 🌍 CORS            | Cross-origin request control   |

---

## 🗄️ Database & Services

| Technology       | Purpose                              |
| ---------------- | ------------------------------------ |
| 🍃 MongoDB Atlas | Application database                 |
| ☁️ Cloudinary    | File/image storage                   |
| 📧 Nodemailer    | Email verification and communication |
| ▲ Vercel         | Frontend deployment                  |
| 🚀 Render        | Backend deployment                   |

---

# 📂 Project Structure

```text
SkillBridge/
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   │
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Ramit-Sonar/SkillBridge.git
cd SkillBridge
```

## 2. Install Frontend Dependencies

```bash
cd Frontend
npm install
```

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd Backend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_SERVICE=gmail
```

> ⚠️ Never commit `.env` files or expose database credentials, JWT secrets, email passwords, or API keys.

---

# ▶️ Running Locally

### Start Backend

```bash
cd Backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Start Frontend

```bash
cd Frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🧪 Testing

SkillBridge uses multiple testing approaches:

### 🔹 Unit Testing

Testing individual functions or components where applicable.

### 🔹 API Testing

Testing REST APIs using **Postman**.

### 🔹 Integration Testing

Testing communication between frontend, backend, database, and external services.

### 🔹 Functional Testing

Testing complete application workflows manually.

### 🔹 User Acceptance Testing

Testing the system from the user's perspective to verify that requirements are satisfied.

### 🔹 Production Testing

Testing important workflows after deployment to verify that the production environment behaves correctly.

---

# 🔒 Security

The application includes security mechanisms such as:

* 🔐 Password hashing
* 🎫 JWT-based authentication
* 👥 Role-based authorization
* 🍪 Authentication cookies
* 🌍 CORS configuration
* 🔑 Environment-based secret management
* 📁 File upload validation
* 🛡️ Protected backend routes
* 🚫 Unauthorized resource access prevention

---

# 🤝 Git & Team Collaboration

The project is developed collaboratively using Git and GitHub.

```text
                    main
                     │
          ┌──────────┴──────────┐
          │                     │
   frontend-work          backend-work
          │                     │
      Frontend               Backend
          │                     │
          └──────────┬──────────┘
                     ↓
                   main
```

Feature branches are used to organize development before merging completed work into the main branch.

---

# 🗺️ Future Improvements

Possible future improvements include:

* 🔔 Real-time notifications
* 💬 WebSocket-based messaging
* 📱 Progressive Web App / mobile application
* 📈 Advanced analytics
* 🤖 AI-assisted job matching
* 🔎 Advanced skill verification
* 🛡️ Advanced security monitoring
* ⚡ Large-scale performance optimization

---

# 🎓 Project Objective

SkillBridge was developed as an academic project to apply software engineering concepts to a practical real-world problem.

The platform combines:

```text
Academic Knowledge
        +
Full-Stack Development
        +
Database Management
        +
Authentication
        +
Cloud Deployment
        +
Testing
        +
Project Collaboration
        ↓
Student Micro-Work Platform
```

---

# 📌 Project Highlights

* 🌉 Student-focused micro-work platform
* 🎯 Student-client job matching
* 🔐 Authentication and role-based authorization
* 💼 Job and application management
* 📁 Project workspace
* 📊 Project progress tracking
* 💬 Project Discussion and messaging
* 🚨 Reporting system
* ⭐ Reviews and ratings
* 📜 Certificates and skill verification
* ☁️ Cloud file storage
* 📧 Email verification
* 🧪 API and functional testing
* 🚀 Vercel + Render deployment

---

# 👨‍💻 Development Team

### SkillBridge Team

* **Ramit Sonar** 
* **Dikshya Khanal** 
* **Yasan Basnet** 
* **Subash B.K** 

---

# 📄 License

This project was developed for academic and educational purposes.

---

<p align="center">

## 🌉 SkillBridge

### Learn • Work • Build • Grow

<a href="https://skill-bridge-hazel-rho.vercel.app/">
  <strong>🚀 Visit Live Demo</strong>
</a>

</p>
