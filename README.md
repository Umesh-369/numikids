# NIPUN FLN Assessment & Gamification Platform 🎮📚

A comprehensive, gamified learning and assessment platform designed to map, track, and remediate foundational numeracy competencies for children. Fully aligned with India's **NIPUN Bharat (Developmental Goal 3: Involved Learners)** and **NCERT Learning Outcomes** frameworks.

Instead of traditional rote learning and simple correct/incorrect grading, this platform focuses on identifying **competency gaps** (e.g., distinguishing between a place-value misunderstanding and a language comprehension issue) and adaptively guiding children through personalized, interactive learning pathways.

---

## 🚀 Key Features

### 👦 Child Portal
- **Interactive Gamified Lessons**: Engaging game-like interfaces that reduce cognitive load while keeping learning fun.
- **Progressive Skill Trees**: Level-based progression covering 23 comprehensive numeracy stages.
- **Audio Feedback**: Voice guidance and audio cues to help younger children navigate and understand questions easily.

### 👩‍👦 Parent & Educator Portal
- **Real-Time Analytics**: Visual tracking of the child's learning journey and highest independent mastery level.
- **Competency Gap Analysis**: Detailed diagnostic reports explaining *why* a child got a question wrong (e.g., place-value confusion vs. distraction) rather than just giving a score of `0`.
- **Customized Remediation**: Highlights key areas that need extra focus and reports progress relative to state board standards.

### 🧠 Gemini AI Adaptive Question Engine
- **Misconception Remediation**: Uses the **Gemini 1.5 Flash API** to dynamically generate questions tailored to a child's age group, current skill level, and historical error types (e.g., counting errors vs. symbol matching).
- **Rule-Based Fallback**: A fully functioning offline questionnaire system that takes over automatically if the API key is not configured or unavailable.

---

## 🛠️ Tech Stack & Monorepo Architecture

This project is structured as an npm workspaces monorepo:

```
fln/
├── FLN-Code/                 # Web Application Monorepo
│   ├── apps/
│   │   ├── api/              # Express API Server (TypeScript)
│   │   └── web/              # Next.js Web App (React + TailwindCSS)
│   ├── packages/
│   │   └── shared/           # Shared Types & Shared Code Utilities
│   ├── package.json          # Root Monorepo Configurations
│   └── package-lock.json
│
├── FLN Levels Structure/     # 23-level Curriculum & Competency Guidelines
│   ├── Level 1/ to Level 23/ # Detailed markdown files mapping each level
│   └── automate.md           # Automation pipelines and Level workflows
│
├── minutes_of_meeting.md     # Meeting minutes, timelines, and guidelines
├── Metric.md                 # Educational metrics (NIPUN, NCERT, ASER, PARAKH)
├── State-Wise-Data.md        # Comparative analysis of state syllabi
└── README.md                 # Project Overview & Documentation
```

### Backend (`apps/api`)
- **Core**: Node.js, Express, TypeScript
- **Database**: MongoDB & Mongoose
- **Real-Time**: Socket.io (real-time assessment telemetry and updates)
- **Validation**: Zod (type-safe validation)
- **AI Service**: Google Gemini API Integration

### Frontend (`apps/web`)
- **Framework**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS & Vanilla CSS
- **State Management**: Zustand (lightweight, reactive store)
- **Audio**: Custom HTML5 audio wrapper for narration and feedback

---

## 🔢 FLN Numeracy Progression Matrix (23 Levels)

The platform evaluates children through a sequence of 23 carefully structured levels:

| Level | Focus Area | Description / Core Competency |
|:---:|---|---|
| **Level 1** | Quantity Comparison | Visual comparisons (Equal, More, Less) without counting. |
| **Level 2** | Odd One Out | Classification based on shape, size, color, or quantity. |
| **Level 3** | Matching & Relations | Attribute mapping (e.g., Tall to Short, Ball to Circle). |
| **Level 4** | Numbers 1–10 | Recognition, writing, and matching names to digits. |
| **Level 5** | Finger Gestures | Counting numbers 1–10 represented via hand gestures. |
| **Level 6** | Sequences | Number sequences (Before, Between, After) within 10. |
| **Level 7** | Object Addition | Visually adding two groups of objects within 10. |
| **Level 8** | Object Subtraction | Visually taking away objects from a group within 10. |
| **Level 9** | Patterns | Extending simple visual or numeric alternating patterns. |
| **Level 10**| Numeral Comparison | Using mathematical symbols (`<`, `>`, `=`) within 10. |
| **Level 11**| Review Assessment 1 | Comprehensive milestone review for skills up to 10. |
| **Level 12**| Tens & Ones | Introduces basic place value for numbers 11–20. |
| **Level 13**| Numbers 11–30 | Reading, writing, and counting numbers up to 30. |
| **Level 14**| Counting & Tracing | Kinesthetic tracing and counting exercises (11–30). |
| **Level 15**| Mixed Practice | Placement tests, place value, and counting (1–30). |
| **Level 16**| Addition (1–30) | Simple addition and basic carrying within 30. |
| **Level 17**| Subtraction (1–30) | Simple subtraction and basic borrowing within 30. |
| **Level 18**| Ordering (1–30) | Sorting arrays of numbers in ascending/descending order. |
| **Level 19**| Numbers 31–50 | Identifying, reading, and writing numbers 31–50. |
| **Level 20**| Skip Counting | Skip counting in intervals of 2, 3, or 5 up to 50. |
| **Level 21**| Comparison (1–50) | Symbol-based comparison of numbers up to 50. |
| **Level 22**| Ordering (1–50) | Sorting numbers up to 50 in ascending/descending order. |
| **Level 23**| Review Assessment 2 | Comprehensive milestone review for skills up to 50. |

---

## ⚙️ Getting Started

### 📋 Prerequisites
- **Node.js** (v18.x or later)
- **MongoDB** (Local instance or Atlas URI)
- **Gemini API Key** (Get one from Google AI Studio)

### 🔧 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Umesh-369/fln.git
   cd fln
   ```

2. **Install Workspace Dependencies**:
   From the `FLN-Code` root directory, install dependencies for all workspaces:
   ```bash
   cd FLN-Code
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside `FLN-Code/apps/api/.env` and supply the required credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/fln
   JWT_SECRET=your_jwt_secret_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Seed the Database**:
   Populate initial lessons, badges, and curriculum levels:
   ```bash
   npm run seed
   ```

---

## 🏃 Running the Application

To start both the Express backend and the Next.js frontend concurrently, run this from the `FLN-Code` root folder:

```bash
npm run dev
```

- **Backend API**: Runs at [http://localhost:5000](http://localhost:5000)
- **Frontend Portal**: Runs at [http://localhost:3000](http://localhost:3000)

### 🧪 Running Tests

To run test suites for the backend/frontend components:
```bash
npm run test
```