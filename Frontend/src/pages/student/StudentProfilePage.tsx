import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Share2, Copy, Check, ExternalLink, X } from "lucide-react";
import { useModalScrollLock } from "../../app/components/shared/useModalScrollLock";

function ShareModal({
  onClose,
  publicUrl,
  publicPath,
}: {
  onClose: () => void;
  publicUrl: string;
  publicPath: string;
}) {
  const [copied, setCopied] = useState(false);
  useModalScrollLock();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Share Profile
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              Share your professional profile with recruiters, clients, and employers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: "0.72rem" }}>
            Public Profile URL
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
              <p className="text-slate-500 truncate" style={{ fontSize: "0.72rem" }}>
                {publicUrl}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                navigator.clipboard.writeText(publicUrl).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all shrink-0"
              style={{
                background: copied ? "#ECFDF5" : "#F8FAFC",
                color: copied ? "#059669" : "#64748B",
                borderColor: copied ? "#6EE7B7" : "#E2E8F0",
                fontSize: "0.72rem",
              }}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </motion.button>
          </div>
        </div>
        <a
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          style={{ fontSize: "0.875rem" }}
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Profile
        </a>
      </motion.div>
    </motion.div>
  );
}
import {
  DashboardLayout,
  useDashboardCurrentUser,
} from "../../app/components/layout/DashboardLayout";
import { StudentProfileView } from "../../app/components/shared/StudentProfileView";
import { buildStudentProfileViewProps } from "../../app/components/shared/studentProfileBuilder";
import { getProfile, setProfile, subscribeProfile } from "../../app/data/profileStore";
import { getMyProjects, type ProjectSummary } from "../../services/projectService";
import {
  getStudentRatingSummary,
  getStudentReviews,
  type StudentRatingSummary,
  type StudentReviewSummary,
} from "../../services/reviewService";
import { getStudentProfile } from "../../services/studentProfileService";
import { getVerificationStatus } from "../../services/verificationService";

function StudentProfileContent() {
  const currentUser = useDashboardCurrentUser();
  const [shareOpen, setShareOpen] = useState(false);
  const [profile, setProfileState] = useState(getProfile());
  const [ratingSummary, setRatingSummary] = useState<StudentRatingSummary | null>(null);
  const [reviews, setReviews] = useState<StudentReviewSummary[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectSummary[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);

  useEffect(() => {
    let mounted = true;

    const loadStudentProfile = async () => {
      // Load profile sections independently so one failed request does not hide the profile.
      const [profileResult, ratingResult, reviewsResult, projectsResult, verificationResult] =
        await Promise.allSettled([
          getStudentProfile(),
          getStudentRatingSummary(),
          getStudentReviews(),
          getMyProjects(),
          getVerificationStatus(),
        ]);

      if (!mounted) return;

      if (profileResult.status === "fulfilled" && profileResult.value.data) {
        const profileData = profileResult.value.data;
        setProfile({
          bio: profileData.bio ?? "",
          education: profileData.education ?? "",
          university: profileData.university ?? "",
          skills: profileData.skills ?? [],
          verifiedSkills: profileData.verifiedSkills ?? [],
          github: profileData.github ?? "",
          linkedin: profileData.linkedin ?? "",
          portfolio: profileData.portfolio ?? "",
          certificates: profileData.certificates ?? [],
        });
      }

      if (ratingResult.status === "fulfilled") {
        setRatingSummary(ratingResult.value.data);
      }

      if (reviewsResult.status === "fulfilled") {
        setReviews(reviewsResult.value.data.reviews);
      }

      if (projectsResult.status === "fulfilled") {
        setCompletedProjects(
          projectsResult.value.data.projects.filter((project) => project.status === "completed")
        );
      }

      if (verificationResult.status === "fulfilled") {
        setVerificationStatus(verificationResult.value.data?.status ?? null);
      } else {
        setVerificationStatus(null);
      }
    };

    loadStudentProfile();
    // Refresh when returning from Settings or another tab where profile data changed.
    window.addEventListener("focus", loadStudentProfile);

    return () => {
      mounted = false;
      window.removeEventListener("focus", loadStudentProfile);
    };
  }, []);

  // Re-render whenever Settings saves to the local profile store.
  useEffect(() => subscribeProfile(() => setProfileState(getProfile())), []);

  const profileView = buildStudentProfileViewProps({
    user: currentUser,
    profile,
    verified: verificationStatus === "approved",
    ratingSummary,
    reviews,
    completedProjects,
  });
  const publicPath = currentUser?._id ? `/p/${currentUser._id}` : "/p";
  const publicUrl = `${window.location.origin}${publicPath}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Share button */}
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-500 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            style={{ fontSize: "0.78rem" }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share Profile
          </motion.button>
        </div>

        <StudentProfileView profile={profileView} />
      </motion.div>

      <AnimatePresence>
        {shareOpen && (
          <ShareModal
            onClose={() => setShareOpen(false)}
            publicPath={publicPath}
            publicUrl={publicUrl}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function StudentProfilePage() {
  return (
    <DashboardLayout role="student" title="My Profile" activeNav="profile">
      <StudentProfileContent />
    </DashboardLayout>
  );
}
