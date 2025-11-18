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
import Ocr from "./pages/Ocr";

export default function App() {
  return (
    <Routes>
      {/* ✅ หน้าแรก (Landing Page) */}
      <Route path="/" element={<Landing />} />

      {/* ✅ หน้าหลัก */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/farmform" element={<FarmForm />} />
      <Route path="/summary" element={<Summary />} />
      <Route path="/history" element={<History />} />
      <Route path="/valuesummary" element={<ValueSummary />} />
      <Route path="/calculate" element={<Calculate />} />
      <Route path="/Ocr" element={<Ocr />} />

      {/* ✅ fallback ถ้า route ไม่เจอ → กลับหน้า Landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
