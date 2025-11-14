import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmForm from "./pages/FarmForm";
import Summary from "./pages/Summary";
import History from "./pages/History";
import ValueSummary from "./pages/ValueSummary";
import Calculate from "./pages/Calculate";
import ProductDetail from "./pages/ProductDetail"; 

// ⭐️ 1. Component "ด่านตรวจ" (ProtectedRoute)
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

      {/* ⭐️ 2. Routes ที่ต้อง Login (หุ้มด้วย ProtectedRoute) */}
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

      {/* ⭐️ 3. แก้ไข Path ให้รับ farmId (สำคัญมาก) */}
      {/* (ของเดิมคือ path="/calculate" และ path="/summary")
      */}
      <Route 
        path="/farm/:farmId/calculate" 
        element={<ProtectedRoute><Calculate /></ProtectedRoute>} 
      />
      <Route 
        path="/farm/:farmId/summary" 
        element={<ProtectedRoute><Summary /></ProtectedRoute>} 
      />

      {/* (เผื่อไว้สำหรับ Dashboard กด "ดูเพิ่มเติม" แล้วไปหน้านี้) */}
      {/* <Route 
        path="/farm/:farmId" 
        element={<ProtectedRoute><FarmDetailPage /></ProtectedRoute>} 
      /> */}

      {/* ถ้าเข้า Path มั่ว, กลับไปหน้าแรก */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}