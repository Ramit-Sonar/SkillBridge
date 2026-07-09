import { motion } from "motion/react";
import { Link } from "react-router";
import { Zap } from "lucide-react";
import { StudentProfileView } from "../../app/components/shared/StudentProfileView";

const PROFILE = {
  name: "Ramit Sonar",
  initials: "RS",
  headline: "Computer Engineering Student",
  bio: "Computer Engineering student passionate about web development, React, UI design, and building modern digital products. I enjoy creating clean interfaces and solving real problems through technology.",
  verified: true,
  skills: [
    { name: "React", verified: true },
    { name: "Figma", verified: true },
    { name: "JavaScript", verified: false },
  ],
  github: "github.com/ramitsonar",
  linkedin: "linkedin.com/in/ramitsonar",
  portfolio: "ramitsonar.com",
};

export default function PublicProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Minimal header */}
      <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="font-bold text-slate-900" style={{ fontSize: "0.95rem" }}>
            Skill<span style={{ color: "#2563EB" }}>Bridge</span>
          </span>
        </Link>
        <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
          Public Profile
        </p>
      </header>

      {/* Profile content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <StudentProfileView profile={PROFILE} />
        </motion.div>
      </main>
    </div>
  );
}
