import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Calculate() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 p-4">หน้านี้: คำนวณผลผลิต</main>
      <Footer />
    </div>
  );
}
