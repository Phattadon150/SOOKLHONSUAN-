import { Routes, Route, Navigate } from "react-router-dom";
// ⭐️ แก้ไข: เพิ่ม .jsx ต่อท้าย path
import OCRPage from "./pages/OCRPage.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FarmForm from "./pages/FarmForm.jsx";
import Summary from "./pages/Summary.jsx";
import History from "./pages/History.jsx";
import ValueSummary from "./pages/ValueSummary.jsx";
import Calculate from "./pages/Calculate.jsx";
import ProductDetail from "./pages/ProductDetail.jsx"; 
import CompleteGoogleSignup from "./pages/CompleteGoogleSignup.jsx"; 


// ⭐️ Component "ด่านตรวจ" (ProtectedRoute)
// (เก็บไว้ใน App.jsx หรือย้ายไปไฟล์แยกก็ได้ครับ)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    // ถ้าไม่มี Token, เด้งไปหน้า Login
    return <Navigate to="/login" replace />;
  }
  return children; // ถ้ามี Token, แสดงหน้าที่ร้องขอ
};

export default function App() {
  return (
    <Routes>
      {/* Routes สาธารณะ */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* ⭐️ 2. (ใหม่) เพิ่ม Route สำหรับหน้ายืนยัน Google (เป็น Public) */}
      <Route 
        path="/complete-google-signup" 
        element={<CompleteGoogleSignup />} 
      />

      {/* ⭐️ Routes ที่ต้อง Login (หุ้มด้วย ProtectedRoute) */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
      />
      <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* ⭐ เปิดหน้า OCR แบบไม่ต้อง login */}
  <Route path="/ocr" element={<OCRPage />} />

  {/* Routes ที่ต้อง Login */}
  <Route 
    path="/dashboard" 
    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
  />

      <Route 
        path="/farmform" 
        element={<ProtectedRoute><FarmForm /></ProtectedRoute>} 
      />
      <Route 
        path="/history" 
        element={<ProtectedRoute><History /></ProtectedRoute>} 
      />
      <Route 
        path="/valuesummary" 
        element={<ProtectedRoute><ValueSummary /></ProtectedRoute>} 
      />
      <Route 
        path="/product/:crop" 
        element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} 
      />

      {/* Routes ที่ต้อง Login และมี farmId */}
      <Route 
        path="/farm/:farmId/calculate" 
        element={<ProtectedRoute><Calculate /></ProtectedRoute>} 
      />
      <Route 
        path="/farm/:farmId/summary" 
        element={<ProtectedRoute><Summary /></ProtectedRoute>} 
      />

      {/* ถ้าเข้า Path มั่ว, กลับไปหน้าแรก */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    
  );
}