# SookLhonSuan (สุขล้นสวน)
**Smart Yield Tracker for New-Gen Farmers**

แพลตฟอร์มช่วยลูกหลานเกษตรกรที่ได้รับมรดกเป็นที่ดิน  
แต่ไม่มีพื้นฐานการทำเกษตร ให้สามารถคำนวณและวางแผนผลผลิตได้อย่างมั่นใจ

---

## Problem Statement
เกษตรกรรุ่นใหม่จำนวนมากมีที่ดินอยู่ในมือ  
แต่ไม่มีความรู้ในการวางแผนผลผลิตและคาดการณ์รายได้  
ระบบนี้จึงช่วยให้เห็นภาพรวมของสวนและผลผลิตแบบดิจิทัล

---

## Objectives
- คำนวณผลผลิตจากจำนวนต้นและน้ำหนักเฉลี่ย  
- แสดงแนวโน้มผลผลิตย้อนหลัง  
- เก็บประวัติและมูลค่ารวมของสวน  
- เปรียบเทียบผลผลิตแต่ละรอบ  

---

## Tech Stack
| Layer | Technology |
|-------|-------------|
| Frontend | React (Vite), Recharts, Zustand, Axios, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Team Roles

| Name | Git Branch | Role | Responsibility |
|------|-------------|------|----------------|
| **Folk** | `feature/frontend-visualization`| Frontend Lead | Dashboard Page, Input Form, Routing, UI |
| **Porjai** | `feature/frontend-dashboard` | Product Owner / Frontend Visualization | Summary Page, History Page, Charts Integration |
| **Praew** | `feature/backend-api` | Backend Lead | Database, Auth, CRUD, Calculation API |
| **Google** | `feature/deployment` | Fullstack / DevOps | API Integration, Deployment (Vercel + Railway), QA & Docs |

---

## Workflow
```bash
# Pull branch
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b feature/<your-feature-name>

# Push work
git add .
git commit -m "add <your-feature>"
git push origin feature/<your-feature-name>
