import HamburgerMenu from "./HamburgerMenu";
import logo from "/logosook.png";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm relative">
      {/* Hamburger ซ้าย */}
      <div className="absolute left-4">
        <HamburgerMenu />
      </div>

      {/* โลโก้ตรงกลาง */}
      <div className="flex-1 flex justify-center">
        <img
          src={logo}
          alt="สุขล้นสวน"
          className="h-10 w-auto object-contain"
        />
      </div>
    </header>
  );
}
