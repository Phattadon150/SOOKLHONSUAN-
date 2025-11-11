import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div className="text-xl font-semibold text-green-800">
        สุขล้นสวน
      </div>
      <HamburgerMenu />
    </header>
  );
}
