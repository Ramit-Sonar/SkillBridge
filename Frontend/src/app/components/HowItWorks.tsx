import type { ReactNode } from "react";
import { motion } from "motion/react";
import { UserPlus, ShieldCheck, Search, Users, Star, BookOpen } from "lucide-react";

interface Step {
  number: string;
  icon: ReactNode;
  title: string;
  blurb: string;
  tag: string;
  color: string;
  bg: string;
}

const steps: Step[] = [
  {
    number: "01",
    icon: <UserPlus className="w-5 h-5" />,
    title: "Student Registration",
    blurb: "Sign up with your university email. Your profile is ready in minutes.",
    tag: "🎓 University email required",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    number: "02",
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Profile Verification",
    blurb: "Upload your student ID. We review and badge your profile promptly.",
    tag: "⚡ Quick turnaround",
    color: "#14B8A6",
    bg: "#F0FDFA",
  },
  {
    number: "03",
    icon: <Search className="w-5 h-5" />,
    title: "Client Posts Project",
    blurb: "Clients publish live briefs. Browse and apply to what fits your skills.",
    tag: "📋 New projects posted daily",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    number: "04",
    icon: <Users className="w-5 h-5" />,
    title: "Student Gets Hired",
    blurb: "Chat, agree on scope, and start. Payment is secured in escrow before work begins.",
    tag: "🔒 Escrow-protected payment",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    number: "05",
    icon: <Star className="w-5 h-5" />,
    title: "Project Completion",
    blurb: "Deliver your work, collect client feedback, and receive payment automatically.",
    tag: "✅ Auto-released on approval",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    number: "06",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Work History Generated",
    blurb: "A verified, client-reviewed entry is added permanently to your profile.",
    tag: "📁 Permanent & exportable",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-500 uppercase tracking-widest mb-5"
            style={{ fontSize: "0.65rem", fontWeight: 700 }}
          >
            How It Works
          </span>
          <h2
            className="text-slate-900 tracking-tight"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15 }}
          >
            From sign-up to your first project,{" "}
            <span style={{ color: "#14B8A6" }}>a clear path forward.</span>
          </h2>
          <p
            className="mt-3 text-slate-500 max-w-lg mx-auto leading-relaxed"
            style={{ fontSize: "0.9rem" }}
          >
            Six steps. No gatekeeping. The process is designed to get you working as quickly as
            possible.
          </p>
        </motion.div>

        {/* Steps: 2-column staggered grid on desktop, single column on mobile */}
        <div className="grid lg:grid-cols-2 gap-x-12 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isLeft ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.1 }}
                style={{ marginTop: i === 1 ? "2.5rem" : 0 }}
                className={`relative flex gap-5 ${i >= steps.length - 2 ? "pb-0" : "pb-10"}`}
              >
                {/* Node + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 z-10"
                    style={{ background: step.bg, color: step.color }}
                  >
                    {step.icon}
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white flex items-center justify-center shadow"
                      style={{ fontSize: "0.55rem", fontWeight: 800, background: step.color }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* Mobile connector preserves the step sequence when the grid collapses. */}
                  {i < steps.length - 1 && (
                    <div
                      className="w-px flex-1 mt-2 lg:hidden"
                      style={{
                        minHeight: "2rem",
                        background: `linear-gradient(to bottom, ${step.color}30, ${steps[i + 1].color}15)`,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <span
                    className="uppercase tracking-widest font-bold"
                    style={{ color: step.color, fontSize: "0.6rem" }}
                  >
                    Step {step.number}
                  </span>
                  <h3
                    className="text-slate-900 mt-0.5 mb-1.5 leading-snug"
                    style={{ fontSize: "1rem", fontWeight: 700 }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-slate-500 leading-relaxed mb-3"
                    style={{ fontSize: "0.84rem" }}
                  >
                    {step.blurb}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: step.bg,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: step.color,
                    }}
                  >
                    {step.tag}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
