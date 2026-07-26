import { motion } from "motion/react";
import { Link } from "react-router";
import {
  GraduationCap,
  FolderOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";
import { usePlatformSettings } from "../data/platformSettingsStore";

interface ValueBlock {
  icon: React.ReactNode;
  color: string;
  bg: string;
  title: string;
  description: string;
}

const values: ValueBlock[] = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "Earn While Learning",
    description:
      "Work flexible projects around your class schedule without compromising your academics.",
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    color: "#14B8A6",
    bg: "#F0FDFA",
    title: "Build a Real Portfolio",
    description:
      "Every project you complete is client-verified and permanently logged on your profile.",
  },
  {
    icon: <Award className="w-5 h-5" />,
    color: "#F59E0B",
    bg: "#FFFBEB",
    title: "Become Industry Ready",
    description:
      "Graduate with a track record of real client work that speaks louder than a degree alone.",
  },
];

const principles = [
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    label: "Student-first platform",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    label: "University verified",
    color: "#14B8A6",
    bg: "#F0FDFA",
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: "Human-reviewed projects",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
];

type WhyChooseProps = {
  getStartedPath: string;
};

export function WhyChoose({ getStartedPath }: WhyChooseProps) {
  const { platformName } = usePlatformSettings();

  return (
    <section id="about" className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Visual proof sits beside the value copy to keep this section concrete. */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-[#1E3A5F]">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM258QKe5_AH9jplfoa8W3Q3JK1B7YizrS4g&s"
                alt="Students at campus"
                className="w-full h-full object-cover object-center scale-105"
                style={{
                  filter: "contrast(1.12) saturate(1.15) brightness(1.04)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(20,184,166,0.06) 100%)",
                }}
              />
            </div>

            {/* Floating badges reinforce trust signals without adding metrics. */}
            <div className="absolute -top-4 -right-4 lg:-right-6 bg-white/90 backdrop-blur-xl border border-white shadow-xl px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p
                  className="text-slate-900 font-bold leading-tight"
                  style={{ fontSize: "0.75rem" }}
                >
                  University Verified
                </p>
                <p className="text-slate-500" style={{ fontSize: "0.62rem" }}>
                  Every student is ID-checked
                </p>
              </div>
            </div>

            {/* Portfolio badge mirrors the student-facing profile outcome. */}
            <div className="absolute -bottom-4 -left-4 lg:-left-6 bg-white/90 backdrop-blur-xl border border-white shadow-xl px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <p
                  className="text-slate-900 font-bold leading-tight"
                  style={{ fontSize: "0.75rem" }}
                >
                  Verified Portfolio
                </p>
                <p className="text-slate-500" style={{ fontSize: "0.62rem" }}>
                  Auto-generated after each project
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mission copy and value blocks explain why the platform exists. */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="flex flex-col gap-8"
          >
            <div>
              <span
                className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-amber-600 uppercase tracking-widest mb-5"
                style={{ fontSize: "0.65rem", fontWeight: 700 }}
              >
                Why {platformName}
              </span>
              <h2
                className="text-slate-900 tracking-tight"
                style={{
                  fontSize: "clamp(1.9rem, 3vw, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                Students deserve <span style={{ color: "#F59E0B" }}>real experience</span>, not just
                a degree.
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                The gap between graduation and first job is narrowing for students who arrive with a
                verified track record. {platformName} exists to give every student that edge before
                they ever graduate.
              </p>
            </div>

            {/* Value blocks */}
            <div className="flex flex-col gap-3">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.1 }}
                  className="group flex items-start gap-4 bg-slate-50 hover:bg-white rounded-2xl p-4 border border-black/[0.04] hover:border-black/[0.08] hover:shadow-lg transition-all duration-300 cursor-default"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: v.bg, color: v.color }}
                  >
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="text-slate-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                      {v.title}
                    </h4>
                    <p
                      className="text-slate-500 mt-0.5 leading-relaxed"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {v.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              to={getStartedPath}
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold w-fit px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors duration-200 shadow-sm"
              style={{ fontSize: "0.875rem" }}
            >
              Join {platformName} for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Principle labels avoid unsupported metrics while still summarizing trust. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="border-t border-black/[0.06] pt-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {principles.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-black/[0.05] bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.icon}
                </div>
                <span className="text-slate-600 font-semibold" style={{ fontSize: "0.82rem" }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
