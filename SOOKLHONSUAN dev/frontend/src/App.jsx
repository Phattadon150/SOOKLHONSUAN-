import { Routes, Route, Navigate } from "react-router-dom";
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
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx"; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Routes สาธารณะ */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Route สำหรับหน้ากรอกอีเมล (กดจากหน้า Login จะมาหน้านี้) */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* ⭐ 2. เพิ่ม Route สำหรับหน้าตั้งรหัสผ่านใหม่ (กดจากอีเมลจะมาหน้านี้) */}
      <Route path="/reset-password" element={<ResetPassword />} /> 
      
      <Route 
        path="/complete-google-signup" 
        element={<CompleteGoogleSignup />} 
      />

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
      <Route 
        path="/farm/:farmId/ocr" 
        element={<ProtectedRoute><OCRPage /></ProtectedRoute>} 
      />
      <Route 
        path="/farm/:farmId/calculate" 
        element={<ProtectedRoute><Calculate /></ProtectedRoute>} 
      />
      <Route 
        path="/farm/:farmId/summary" 
        element={<ProtectedRoute><Summary /></ProtectedRoute>} 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}