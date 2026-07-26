import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, Briefcase, CheckCircle, Star, Clock } from "lucide-react";
import { usePlatformSettings } from "../data/platformSettingsStore";

interface FloatingCard {
  id: number;
  icon: ReactNode;
  label: string;
  value: string;
  bg: string;
  className: string;
}

const floatingCards: FloatingCard[] = [
  {
    id: 1,
    icon: <CheckCircle className="w-4 h-4 text-teal-500" />,
    label: "Verified Student",
    value: "ID Confirmed",
    bg: "bg-white",
    className: "top-8 -left-8 lg:-left-12",
  },
  {
    id: 2,
    icon: <Briefcase className="w-4 h-4 text-blue-600" />,
    label: "Project Completed",
    value: "E-commerce UX Design",
    bg: "bg-white",
    className: "bottom-24 -left-4 lg:-left-8",
  },
  {
    id: 3,
    icon: <Star className="w-4 h-4 text-amber-500" fill="#F59E0B" />,
    label: "Client Rating",
    value: "4.9 / 5.0",
    bg: "bg-white",
    className: "top-16 -right-4 lg:-right-8",
  },
  {
    id: 4,
    icon: <Clock className="w-4 h-4 text-violet-500" />,
    label: "Work History",
    value: "12 Projects · $2,400",
    bg: "bg-white",
    className: "bottom-8 -right-8 lg:-right-12",
  },
];

type HeroProps = {
  getStartedPath: string;
  exploreJobsPath: string;
};

export function Hero({ getStartedPath, exploreJobsPath }: HeroProps) {
  const { platformDescription } = usePlatformSettings();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 40%, #F0FDFA 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F172A'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: "#2563EB" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{ background: "#14B8A6" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-blue-600/20 rounded-full px-4 py-1.5 w-fit shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                Now Live · Student Platform
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="text-slate-900 leading-[1.1] tracking-tight"
                style={{
                  fontSize: "clamp(2.6rem, 5vw, 4rem)",
                  fontWeight: 800,
                }}
              >
                Where Students{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #14B8A6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Learn &amp; Grow
                </span>{" "}
                with Real Work
              </h1>
              <p
                className="mt-5 text-slate-500 leading-relaxed max-w-lg"
                style={{ fontSize: "1.1rem" }}
              >
                {platformDescription}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                to={getStartedPath}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={exploreJobsPath}
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-xl border border-black/10 hover:border-blue-600/30 hover:bg-blue-50 transition-all duration-200 text-sm shadow-sm"
              >
                Explore Jobs
              </Link>
            </div>
          </div>

          {/* Right: hero visual */}
          <div className="relative flex items-center justify-center">
            {/* Main image */}
            <div
              className="relative w-full max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl"
              style={{
                aspectRatio: "4/3",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              <img
                src="https://www.eemc.edu.np/uploads/sliders/EEC_Home_Banner.jpeg"
                alt="Students at EEC campus"
                className="w-full h-full object-cover"
              />
              {/* Tint overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(20,184,166,0.1) 100%)",
                }}
              />
            </div>

            {/* Floating cards */}
            {floatingCards.map((card) => (
              <div
                key={card.id}
                className={`absolute ${card.className} ${card.bg} rounded-2xl shadow-xl border border-black/5 px-4 py-3 flex items-center gap-3 min-w-max`}
                style={{
                  animation: `float ${3 + card.id * 0.7}s ease-in-out infinite alternate`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-xs font-semibold text-slate-900">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
}
