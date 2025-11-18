export default function ProductCard({ name, area, diff }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center mb-3">
      <div>
        <p className="font-semibold text-green-900">{name}</p>
        <p className="text-sm text-gray-600">จำนวนไร่: {area} ไร่</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${diff < 0 ? "text-red-600" : "text-green-600"}`}>
          {diff}%
        </p>
        <button className="mt-1 text-sm text-green-700 underline">ดูเพิ่มเติม</button>
      </div>
    </div>
  );
}
