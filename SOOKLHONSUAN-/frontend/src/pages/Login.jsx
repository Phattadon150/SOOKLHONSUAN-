export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4 text-green-800">เข้าสู่ระบบ</h1>
      <input
        type="text"
        placeholder="ชื่อผู้ใช้"
        className="mb-3 p-2 border rounded-lg w-64"
      />
      <input
        type="password"
        placeholder="รหัสผ่าน"
        className="mb-4 p-2 border rounded-lg w-64"
      />
      <button className="bg-green-700 text-white px-6 py-2 rounded-lg">
        ลงชื่อเข้าใช้
      </button>
    </div>
  );
}
