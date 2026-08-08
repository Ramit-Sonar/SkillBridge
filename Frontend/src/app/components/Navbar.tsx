import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { BrandLogoMark } from "@/app/components/shared/BrandLogoMark";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

type NavbarProps = {
  getStartedPath: string;
  loginPath: string;
};

export function Navbar({ getStartedPath, loginPath }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <BrandLogoMark className="w-14 h-10 transition-shadow duration-300 group-hover:shadow-blue-100" />
            <span
              className="font-bold text-slate-900 tracking-tight"
              style={{ fontSize: "1.25rem" }}
            >
              Skill<span style={{ color: "#2563EB" }}>Bridge</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-slate-500 hover:text-slate-900 transition-colors duration-200 text-sm font-medium"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to={loginPath}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200 px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              to={getStartedPath}
              className="text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-blue-200 hover:shadow-md active:scale-95"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-black/5 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-black/5">
              <Link to={loginPath} className="text-sm font-medium text-slate-500 py-2">
                Login
              </Link>
              <Link
                to={getStartedPath}
                className="text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
