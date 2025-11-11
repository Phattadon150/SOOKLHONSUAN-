import Header from "../components/Header";

export default function Login() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col justify-center items-center px-4">
        <h1 className="text-2xl font-semibold mb-6 text-green-800">
          เข้าสู่ระบบ
        </h1>
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
        <button className="bg-green-700 text-white px-6 py-2 rounded-lg w-64">
          ลงชื่อเข้าใช้
        </button>
        <button className="mt-3 text-green-800 underline">สมัครใช้งาน</button>
      </main>
    </div>
  );
}
