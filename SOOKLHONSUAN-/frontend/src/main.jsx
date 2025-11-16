import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// ⭐️ 1. (แก้ไข) อัปเดต Path ให้ชี้ไปที่โฟลเดอร์ src/
import App from "../src/App"; 
import "../src/index.css";

// ⭐️ 2. Import Provider
import { GoogleOAuthProvider } from "@react-oauth/google";

// ⭐️ 3. ใส่ Client ID ของคุณที่นี่
// (นี่คือค่าตัวอย่าง - คุณต้องใช้ Client ID จริงของคุณ)
const GOOGLE_CLIENT_ID = "176658208646-2gepfppci4p5pki77vagh78ltu76tn6q.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ⭐️ 4. ห่อ BrowserRouter (และ App) ด้วย Provider นี้ */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);