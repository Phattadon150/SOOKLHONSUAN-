import { useState } from "react";
import { Link } from "react-router-dom";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="text-3xl text-green-800"
        onClick={() => setOpen(!open)}
      >
        {open ? "✖" : "☰"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl p-4 z-50">
          {[
            { label: "คำนวณผลผลิต", to: "/calculate" },
            { label: "สรุปผล", to: "/summary" },
            { label: "ประวัติ", to: "/history" },
            { label: "มูลค่าสวน", to: "/value-summary" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block bg-green-700 hover:bg-green-800 text-white rounded-lg py-2 mb-2 text-center last:mb-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
