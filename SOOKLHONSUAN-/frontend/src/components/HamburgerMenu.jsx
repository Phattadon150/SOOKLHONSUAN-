import { useState } from "react";
import { Link } from "react-router-dom";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-3xl text-green-800 focus:outline-none"
      >
        {open ? "✖" : "☰"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-xl p-4 w-48 z-50">
          <Link
            to="/calculate"
            className="block bg-green-700 text-white rounded-lg py-2 mb-2 text-center hover:bg-green-800"
            onClick={() => setOpen(false)}
          >
            คำนวณผลผลิต
          </Link>
          <Link
            to="/summary"
            className="block bg-green-700 text-white rounded-lg py-2 mb-2 text-center hover:bg-green-800"
            onClick={() => setOpen(false)}
          >
            สรุปผล
          </Link>
          <Link
            to="/history"
            className="block bg-green-700 text-white rounded-lg py-2 mb-2 text-center hover:bg-green-800"
            onClick={() => setOpen(false)}
          >
            ประวัติ
          </Link>
          <Link
            to="/value-summary"
            className="block bg-green-700 text-white rounded-lg py-2 text-center hover:bg-green-800"
            onClick={() => setOpen(false)}
          >
            มูลค่าสวน
          </Link>
        </div>
      )}
    </div>
  );
}
