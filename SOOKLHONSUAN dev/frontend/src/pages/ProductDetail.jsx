import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ProductDetail() {
  const { crop } = useParams(); // ดึงชื่อพืชจาก URL เช่น /product/ลำไย
  const navigate = useNavigate();
  const user = localStorage.getItem("currentUser");

  const [productData, setProductData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`farmData_${user}`));
    if (!stored) return;
    setProductData(stored);
    setTempData(stored);
  }, [user]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setTempData(productData); // ย้อนกลับค่าเก่า
  };

  const handleSave = () => {
    const updated = { ...productData, ...tempData };
    setProductData(updated);
    localStorage.setItem(`farmData_${user}`, JSON.stringify(updated));
    setEditMode(false);
    alert("✅ บันทึกข้อมูลสำเร็จ!");
  };

  if (!productData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>ไม่พบข้อมูลผลผลิต</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 p-6 max-w-lg mx-auto bg-white shadow rounded-xl space-y-4">
        <h1 className="text-green-800 text-xl font-bold text-center mb-4">
          รายละเอียดผลผลิต ({crop})
        </h1>

        {/* ฟอร์มแสดงข้อมูล */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-gray-600">ชื่อพืช</span>
            <input
              type="text"
              value={tempData.crop || ""}
              disabled={!editMode}
              onChange={(e) =>
                setTempData({ ...tempData, crop: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 mt-1 ${
                editMode
                  ? "bg-white border-green-400"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </label>

          <label className="block">
            <span className="text-gray-600">พื้นที่ (ไร่)</span>
            <input
              type="number"
              value={tempData.area || 5}
              disabled={!editMode}
              onChange={(e) =>
                setTempData({ ...tempData, area: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 mt-1 ${
                editMode
                  ? "bg-white border-green-400"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </label>

          <label className="block">
            <span className="text-gray-600">คุณภาพผลผลิต</span>
            <input
              type="text"
              value={tempData.quality || "ยังไม่มีข้อมูลคุณภาพ"}
              disabled={!editMode}
              onChange={(e) =>
                setTempData({ ...tempData, quality: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 mt-1 ${
                editMode
                  ? "bg-white border-green-400"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </label>

          <label className="block">
            <span className="text-gray-600">เดือนเก็บเกี่ยว</span>
            <input
              type="text"
              value={tempData.month || "ยังไม่มีเดือนเก็บเกี่ยว"}
              disabled={!editMode}
              onChange={(e) =>
                setTempData({ ...tempData, month: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 mt-1 ${
                editMode
                  ? "bg-white border-green-400"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </label>
        </div>

        {/* ปุ่ม */}
        <div className="flex justify-end space-x-3 mt-6">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
              >
                💾 บันทึก
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                ยกเลิก
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              ✏️ แก้ไข
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
