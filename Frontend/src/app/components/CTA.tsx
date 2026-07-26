import { useRef } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, Zap } from "lucide-react";
import { usePlatformSettings } from "../data/platformSettingsStore";

type CTAProps = {
  getStartedPath: string;
};

export function CTA({ getStartedPath }: CTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const { platformName } = usePlatformSettings();

  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ x: -50, opacity: 0.2 }}
          animate={inView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0.2 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden px-8 py-16 lg:px-16 lg:py-20 text-center"
          style={{
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 40%, #0D9488 100%)",
          }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 bg-white" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-10 bg-amber-500" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" fill="#F59E0B" />
              <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
                Join 2,400+ Students
              </span>
            </div>

            <div>
              <h2
                className="text-white leading-tight tracking-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800 }}
              >
                Ready to turn your skills
                <br />
                into real-world income?
              </h2>
              <p
                className="mt-5 text-white/75 leading-relaxed max-w-xl mx-auto"
                style={{ fontSize: "1.05rem" }}
              >
                Join {platformName} for free. Build your verified profile, land your first project, and
                start earning real income before you even graduate.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to={getStartedPath}
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm"
              >
                Join {platformName} Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-200 text-sm"
              >
                See How It Works
              </button>
            </div>

            <p className="text-white/50 text-xs">
              No credit card required · Free student accounts · Projects available immediately
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
