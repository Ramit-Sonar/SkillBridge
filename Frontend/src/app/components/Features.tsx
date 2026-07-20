import { motion } from "motion/react";
import {
  ShieldCheck,
  Briefcase,
  BookOpen,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";

// Inline marketing mockups avoid numeric claims that are not backed by product data.

function VerifiedCardMockup() {
  return (
    <div className="relative w-fit select-none">
      <div className="bg-white rounded-2xl shadow-xl border border-black/[0.06] p-5 w-[230px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-teal-200 shrink-0" />
          <div className="min-w-0">
            <div className="h-3 w-24 bg-slate-200 rounded mb-1.5" />
            <div className="h-2.5 w-32 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {["UI/UX Design", "React", "Figma"].map((s) => (
            <span
              key={s}
              className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full"
              style={{ fontSize: "0.62rem" }}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-500" style={{ fontSize: "0.68rem" }}>
              Available now
            </span>
          </div>
          <div
            className="flex items-center gap-1 bg-teal-50 text-teal-500 font-bold px-2.5 py-1 rounded-full"
            style={{ fontSize: "0.6rem" }}
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            Verified
          </div>
        </div>
      </div>
      <div
        className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
        style={{ fontSize: "0.6rem" }}
      >
        <CheckCircle className="w-2.5 h-2.5" />
        University ID Confirmed
      </div>
    </div>
  );
}

function ProjectListMockup() {
  const items = [
    { title: "Brand Identity Design", tags: ["Design", "Branding"], dot: "#2563EB" },
    { title: "Frontend Development", tags: ["React", "Tailwind"], dot: "#14B8A6" },
    { title: "Content Writing Pack", tags: ["Writing", "SEO"], dot: "#F59E0B" },
  ];
  return (
    <div className="space-y-2 select-none">
      {items.map((p) => (
        <div
          key={p.title}
          className="bg-white border border-black/[0.06] rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.dot }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate" style={{ fontSize: "0.75rem" }}>
              {p.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                  style={{ fontSize: "0.58rem", fontWeight: 600 }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span className="text-slate-400 shrink-0" style={{ fontSize: "0.62rem" }}>
            Open
          </span>
        </div>
      ))}
    </div>
  );
}

function WorkHistoryMockup() {
  const entries = [
    { title: "E-commerce UX Audit", client: "Client · Completed", color: "#2563EB" },
    { title: "Social Media Design Kit", client: "Client · Completed", color: "#14B8A6" },
    { title: "React Component Library", client: "Client · Completed", color: "#7C3AED" },
  ];
  return (
    <div className="space-y-2.5 select-none">
      {entries.map((e) => (
        <div
          key={e.title}
          className="bg-white rounded-xl border border-black/[0.06] shadow-sm px-3.5 py-2.5 flex items-center gap-3"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${e.color}15` }}
          >
            <CheckCircle className="w-3.5 h-3.5" style={{ color: e.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate" style={{ fontSize: "0.72rem" }}>
              {e.title}
            </p>
            <p className="text-slate-400" style={{ fontSize: "0.62rem" }}>
              {e.client}
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${e.color}10`, color: e.color }}
          >
            Verified
          </span>
        </div>
      ))}
    </div>
  );
}

function FlexibilityMockup() {
  const slots = [
    { label: "Morning", active: true },
    { label: "Afternoon", active: false },
    { label: "Evening", active: true },
    { label: "Weekend", active: true },
  ];
  const skills = ["UI Design", "Development", "Writing", "Marketing", "Data", "Research"];
  return (
    <div className="w-full max-w-xs select-none space-y-4">
      {/* Schedule row */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <p
          className="text-white/50 uppercase tracking-widest mb-3"
          style={{ fontSize: "0.58rem", fontWeight: 700 }}
        >
          Your availability
        </p>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-2 text-center transition-all duration-200"
              style={{
                background: s.active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                border: s.active ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
              }}
            >
              <Clock
                className="w-3.5 h-3.5 mx-auto mb-1"
                style={{ color: s.active ? "#F59E0B" : "rgba(255,255,255,0.2)" }}
              />
              <p
                style={{
                  fontSize: "0.55rem",
                  color: s.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Skills row */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <p
          className="text-white/50 uppercase tracking-widest mb-3"
          style={{ fontSize: "0.58rem", fontWeight: 700 }}
        >
          Work categories
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className="bg-white/10 text-white/70 font-medium px-2.5 py-1 rounded-full"
              style={{ fontSize: "0.6rem" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shared entrance animation keeps the landing feature blocks consistent.
const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: easeOut, delay },
  }),
};

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header stays left-aligned to match the asymmetric feature layout. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
          }}
          className="mb-12 max-w-xl"
        >
          <span
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-blue-600 uppercase tracking-widest mb-4"
            style={{ fontSize: "0.65rem", fontWeight: 700 }}
          >
            Platform Features
          </span>
          <h2
            className="text-slate-900 tracking-tight"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15 }}
          >
            Built for students.
            <br />
            <span style={{ color: "#2563EB" }}>Trusted by real clients.</span>
          </h2>
          <p className="mt-3 text-slate-500 leading-relaxed" style={{ fontSize: "0.9rem" }}>
            Every part of the platform is designed to help students do great work and get full
            credit for it.
          </p>
        </motion.div>

        {/* Verification gets the full-width block because it anchors platform trust. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          custom={0}
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          className="group relative bg-slate-50 rounded-3xl border border-black/[0.05] overflow-hidden mb-4 hover:shadow-xl transition-all duration-500"
        >
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <span
                  className="text-blue-600 uppercase tracking-widest"
                  style={{ fontSize: "0.65rem", fontWeight: 700 }}
                >
                  Verified Students
                </span>
              </div>
              <h3
                className="text-slate-900"
                style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", fontWeight: 800, lineHeight: 1.2 }}
              >
                Every student is ID-verified before they take on any client work.
              </h3>
              <p
                className="text-slate-500 leading-relaxed max-w-md"
                style={{ fontSize: "0.875rem" }}
              >
                We check university enrollment at sign-up. Clients always know they're working with
                a real, enrolled student. No ghost profiles, no exceptions.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  "University ID validation on sign-up",
                  "Verified badge visible on every profile",
                  "Verification reviewed by the SkillBridge team",
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600" style={{ fontSize: "0.82rem" }}>
                      {pt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="lg:col-span-2 flex items-center justify-center p-8 lg:p-10 min-h-[200px]"
              style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)" }}
            >
              <VerifiedCardMockup />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 group-hover:w-full transition-all duration-700" />
        </motion.div>

        {/* Project and work-history blocks share one row for related user benefits. */}
        <div className="grid lg:grid-cols-5 gap-4 mb-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            custom={0.08}
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            className="group lg:col-span-3 relative bg-teal-50 rounded-3xl border border-black/[0.05] overflow-hidden hover:shadow-xl transition-all duration-500 p-8"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4 text-teal-500" />
              </div>
              <span
                className="text-teal-500 uppercase tracking-widest"
                style={{ fontSize: "0.65rem", fontWeight: 700 }}
              >
                Real Projects
              </span>
            </div>
            <h3
              className="text-slate-900 mb-2"
              style={{ fontSize: "1.2rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              Not practice runs. Actual client briefs.
            </h3>
            <p
              className="text-slate-500 mb-6 max-w-sm"
              style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
            >
              Browse live projects from real businesses and apply to the ones that match your skills
              and timetable.
            </p>
            <ProjectListMockup />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 group-hover:w-full transition-all duration-700" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            custom={0.16}
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            className="group lg:col-span-2 relative bg-amber-50 rounded-3xl border border-black/[0.05] overflow-hidden hover:shadow-xl transition-all duration-500 p-8"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <span
                className="text-amber-600 uppercase tracking-widest"
                style={{ fontSize: "0.65rem", fontWeight: 700 }}
              >
                Work History
              </span>
            </div>
            <h3
              className="text-slate-900 mb-2"
              style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              Your portfolio builds itself.
            </h3>
            <p className="text-slate-500 mb-6" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
              Each project you complete is timestamped, client-reviewed, and permanently logged on
              your profile.
            </p>
            <WorkHistoryMockup />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-700" />
          </motion.div>
        </div>

        {/* Flexibility closes the section as a full-width contrast panel. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          custom={0.1}
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          className="group relative rounded-3xl overflow-hidden hover:shadow-2xl transition-shadow duration-500"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)" }}
        >
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-12 flex flex-col justify-center gap-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <span
                  className="text-amber-500 uppercase tracking-widest"
                  style={{ fontSize: "0.65rem", fontWeight: 700 }}
                >
                  Earn While Learning
                </span>
              </div>
              <h3
                className="text-white"
                style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", fontWeight: 800, lineHeight: 1.2 }}
              >
                Work on your terms. Keep your studies first.
              </h3>
              <p
                className="text-white/60 max-w-sm"
                style={{ fontSize: "0.875rem", lineHeight: 1.65 }}
              >
                Set your own availability, pick projects that match your schedule, and get paid
                securely through escrow. Flexible by design, so your academics never take a back
                seat.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  "Set your own working hours",
                  "Choose only the projects you want",
                  "Payments secured before you begin",
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-white/60" style={{ fontSize: "0.82rem" }}>
                      {pt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center p-8 lg:p-10">
              <FlexibilityMockup />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
