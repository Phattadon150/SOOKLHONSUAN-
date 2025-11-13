export default function ProductCard({ name, area, diff, quality, month, onView }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 mb-3 flex justify-between items-center">
      <div>
        <h3 className="text-green-900 font-semibold">{name}</h3>
        <p className="text-gray-600">พื้นที่: {area} ไร่</p>
        <p className="text-gray-500">คุณภาพ: {quality}</p>
        <p className="text-gray-500">เดือนเก็บเกี่ยว: {month}</p>
      </div>

      <div className="text-right">
        <p className="text-red-500 font-bold">{diff}%</p>
        <button
          onClick={onView}
          className="text-green-700 text-sm underline hover:text-green-900"
        >
          ดูเพิ่มเติม
        </button>
      </div>
    </div>
  );
}
