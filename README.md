AutiSmart  
AI-Powered Autism Support & Early Detection Platform

Overview

**AutiSmart** is a full-stack AI-driven platform designed to support the autism community through early detection, personalized therapy, and interactive learning.

It combines:

- Deep Learning (**Vision Transformer – ViT-B/16**)  
- AI-powered quiz & therapy engine  
- Interactive therapeutic games  
- Real-time expert–caregiver communication  
- Progress tracking & analytics  

---

## Features

### AI & Machine Learning

- **Autism Screening**  
  Upload a child’s image → AI predicts: `Autistic` / `Non-Autistic`  
  *(ViT-B/16 model via Flask)*

- **AI-Generated Quizzes**  
  Personalized quizzes using **LLaMA 3.3 (Groq)** across:
  - Eye Contact  
  - Social Interaction  
  - Communication  
  - Repetitive Behavior  
  - Sensory Sensitivity  
  - Focus & Attention  

- **Smart Recommendations**  
  AI suggests therapy games based on behavior & activity history  

- **Emotion Explorer**  
  AI-generated emotional scenarios with feedback  

---

### Therapeutic Games

| Game | Skill |
|------|------|
| Eye Contact Game | Attention |
| Memory Match | Memory |
| Emotion Explorer | Emotions |
| Pattern Builder | Cognitive |
| Picture Word Game | Communication |
| Color Matching | Visual |
| Sound Matching | Auditory |
| Communication Builder | Social |

---

### Role-Based System

- **Caregiver** → Manage children, track progress, chat with experts  
- **Expert** → Assess children, create quizzes, provide therapy  
- **Admin** → Manage users & system  

---

### Real-Time Communication

- Socket.IO chat  
- Live notifications (requests, approvals, updates)  

---

### Reporting & Analytics

- Progress dashboards  
- PDF reports  
- Chart.js analytics  
- Leaderboard system  

---

### Security

- JWT Authentication  
- OTP Email Verification  
- Role-based access  
- Secure uploads (Multer)  
---
