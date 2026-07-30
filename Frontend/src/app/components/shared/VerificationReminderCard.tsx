import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useDashboardCurrentUser } from "../layout/DashboardLayout";
import { getVerificationStatus } from "../../../services/verificationService";

interface Props {
  isVerified?: boolean;
  description?: string;
  settingsPath?: string;
}

export function VerificationReminderCard({
  isVerified,
  description = "Complete identity verification to apply for jobs, build trust, and showcase your profile to clients.",
  settingsPath = "/dashboard/student/settings",
}: Props) {
  const navigate = useNavigate();
  const currentUser = useDashboardCurrentUser();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "approved" | "rejected" | null | undefined
  >(undefined);
  const [statusLoadFailed, setStatusLoadFailed] = useState(false);
  const loadingVerificationStatus =
    isVerified === undefined &&
    Boolean(currentUser?._id) &&
    verificationStatus === undefined &&
    !statusLoadFailed;
  const accountVerified =
    isVerified === true ||
    (isVerified === undefined && verificationStatus === "approved") ||
    (isVerified === undefined && statusLoadFailed && currentUser?.isVerified === true);

  useEffect(() => {
    if (isVerified !== undefined || !currentUser?._id) return;

    let mounted = true;

    const loadVerificationStatus = async () => {
      setVerificationStatus(undefined);
      setStatusLoadFailed(false);

      try {
        // Verification.status is authoritative; User.isVerified can lag after resubmission.
        const response = await getVerificationStatus();

        if (mounted) {
          setVerificationStatus(response.data?.status ?? null);
        }
      } catch {
        if (mounted) {
          setVerificationStatus(null);
          setStatusLoadFailed(true);
        }
      }
    };

    loadVerificationStatus();

    return () => {
      mounted = false;
    };
  }, [currentUser?._id, isVerified]);

  if (accountVerified || loadingVerificationStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <ShieldCheck style={{ width: 18, height: 18, color: "#2563EB" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 font-semibold" style={{ fontSize: "0.85rem" }}>
          Verify Your Account
        </p>
        <p className="text-slate-500 mt-0.5 leading-snug" style={{ fontSize: "0.75rem" }}>
          {description}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(settingsPath)}
        className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
        style={{ fontSize: "0.75rem" }}
      >
        Verify Now
      </motion.button>
    </motion.div>
  );
}
