import { Link } from "react-router";
import { BrandLogoMark } from "@/app/components/shared/BrandLogoMark";
import { BrowseJobsCore } from "../student/BrowseJobsPage";

export default function PublicBrowseJobsPage() {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Minimal public navbar */}
      <header className="bg-white border-b border-black/[0.06] px-6 h-16 flex items-center justify-between sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogoMark className="w-14 h-10" />
          <span className="font-bold text-slate-900" style={{ fontSize: "1.25rem" }}>
            Skill<span style={{ color: "#2563EB" }}>Bridge</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-slate-500 font-semibold hover:text-slate-900 transition-colors"
            style={{ fontSize: "0.875rem" }}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            style={{ fontSize: "0.875rem" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Public browsing reuses the same job list behavior as the student dashboard. */}
      <main className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-5">
          <h1 className="text-slate-900" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
            Browse Jobs
          </h1>
          <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.82rem" }}>
            Discover projects posted by local clients. Sign up to apply.
          </p>
        </div>
        <BrowseJobsCore isGuest={true} />
      </main>
    </div>
  );
}
