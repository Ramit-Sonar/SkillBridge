import { Twitter, Linkedin, Github, Mail, MapPin } from "lucide-react";
import { usePlatformSettings } from "../data/platformSettingsStore";
import { BrandLogoMark } from "./shared/BrandLogoMark";

const footerLinks = {
  Product: ["Features", "How It Works", "Pricing", "Roadmap"],
  Students: ["Sign Up", "Browse Projects", "Work History", "Portfolio"],
  Clients: ["Post a Project", "Find Students", "Pricing Plans", "Trust & Safety"],
  Company: ["About Us", "Careers", "Blog", "Press Kit"],
};

export function Footer() {
  const { platformName, supportEmail, platformDescription } = usePlatformSettings();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <a href="#home" className="flex items-center gap-2 mb-4">
              <BrandLogoMark className="w-12 h-9 border-white/10" />
              <span className="font-bold text-white tracking-tight" style={{ fontSize: "1.1rem" }}>
                Skill<span style={{ color: "#60A5FA" }}>Bridge</span>
              </span>
            </a>
            <p
              className="text-slate-400 leading-relaxed max-w-xs mb-6"
              style={{ fontSize: "0.875rem" }}
            >
              {platformDescription}
            </p>
            {/* Contact */}
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-2 text-slate-500"
                style={{ fontSize: "0.8rem" }}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{supportEmail}</span>
              </div>
              <div
                className="flex items-center gap-2 text-slate-500"
                style={{ fontSize: "0.8rem" }}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Remote-first · Global</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-white mb-4 tracking-wide"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {category}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-500 hover:text-slate-400 transition-colors duration-200"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600" style={{ fontSize: "0.8rem" }}>
            © 2026 {platformName}, Inc. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[
              { icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
              { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
              { icon: <Github className="w-4 h-4" />, label: "GitHub" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-slate-600 hover:text-slate-500 transition-colors duration-200"
                style={{ fontSize: "0.75rem" }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
