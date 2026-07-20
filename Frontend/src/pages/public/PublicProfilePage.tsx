import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Zap } from "lucide-react";
import { StudentProfileView } from "../../app/components/shared/StudentProfileView";
import { buildStudentProfileViewProps } from "../../app/components/shared/studentProfileBuilder";
import { getPublicStudentProfile } from "../../services/studentProfileService";
import type { StudentSummary } from "../../services/applicationService";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPublicProfile() {
      if (!username) {
        setError("Student profile link is invalid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getPublicStudentProfile(username);

        if (mounted) {
          // Public profiles are rendered from the backend summary only.
          setProfile(response.data);
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error.message : "Failed to load student profile.");
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPublicProfile();

    return () => {
      mounted = false;
    };
  }, [username]);

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
          {loading ? (
            <div className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center">
              <p className="text-slate-500 font-semibold" style={{ fontSize: "0.85rem" }}>
                Loading profile...
              </p>
            </div>
          ) : error ? (
            <div className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center">
              <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
                {error}
              </p>
            </div>
          ) : profile ? (
            <StudentProfileView profile={buildStudentProfileViewProps({ profile })} />
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
