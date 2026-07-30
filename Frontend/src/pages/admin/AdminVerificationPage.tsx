import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type ElementType,
  type ReactNode,
  type SetStateAction,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import {
  ConfirmDialog,
  FilterChipGroup,
  Notification,
  SearchInput,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import { useModalScrollLock } from "../../app/components/shared/useModalScrollLock";
import {
  approveVerification,
  getAdminClientVerifications,
  getAdminStudentVerifications,
  rejectVerification,
  type AdminClientVerification,
  type AdminStudentVerification,
  type VerificationStatus,
} from "../../services/verificationService";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Eye,
  ShieldCheck,
  User,
  Mail,
  Hash,
  BookOpen,
  Briefcase,
  Phone,
} from "lucide-react";

const STATUS_CFG: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  approved: {
    label: "Verified",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const formatSubmittedDate = (value: string) => {
  if (!value) return "Not submitted";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Shared admin review card used by student and client verification lists.
 */
// Shared card component

function VerificationCard<
  T extends {
    id: string;
    name: string;
    initials: string;
    role?: string;
    avatar?: string;
    submittedAt: string;
    status: VerificationStatus;
  },
>({
  item,
  avatarGradient,
  metaItems,
  onView,
  onApprove,
  onReject,
  isProcessing,
  processingAction,
}: {
  item: T;
  avatarGradient: string;
  metaItems: { icon: ElementType; label: string; value: string }[];
  onView: (r: T) => void;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  isProcessing: boolean;
  processingAction: "approve" | "reject" | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:border-blue-200 p-5 flex flex-col gap-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
            style={{ background: avatarGradient, fontSize: "0.65rem" }}
          >
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={`${item.name} avatar`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              item.initials
            )}
          </div>
          <div>
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.875rem" }}>
              {item.name}
            </p>
            <p className="text-slate-500" style={{ fontSize: "0.68rem" }}>
              {item.role ?? `Submitted ${item.submittedAt}`}
            </p>
          </div>
        </div>
        <StatusBadge config={STATUS_CFG[item.status]} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metaItems.map(({ icon: Icon, label, value }, idx) => (
          <div key={`${label}-${idx}`} className="flex items-start gap-2">
            <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>
                {label}
              </p>
              <p
                className="text-slate-900 font-medium leading-tight"
                style={{ fontSize: "0.72rem" }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onView(item)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 font-semibold py-2 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
          style={{ fontSize: "0.75rem" }}
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
        {item.status === "pending" && (
          <>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onApprove(item.id)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 font-semibold py-2 rounded-xl border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
              style={{ fontSize: "0.75rem" }}
            >
              <CheckCircle className="w-3.5 h-3.5" />{" "}
              {isProcessing && processingAction === "approve" ? "Approving..." : "Approve"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onReject(item.id)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 font-semibold py-2 rounded-xl border border-red-200 hover:bg-red-600 hover:text-white transition-all"
              style={{ fontSize: "0.75rem" }}
            >
              <XCircle className="w-3.5 h-3.5" />{" "}
              {isProcessing && processingAction === "reject" ? "Rejecting..." : "Reject"}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Document placeholder

function DocumentPlaceholder({ label, fileUrl }: { label: string; fileUrl?: string }) {
  if (fileUrl) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-blue-200 transition-colors"
      >
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-slate-700 font-semibold" style={{ fontSize: "0.75rem" }}>
            {label}
          </p>
        </div>
        <div className="h-56 sm:h-64 bg-slate-100 flex items-center justify-center p-2">
          <img src={fileUrl} alt={label} className="w-full h-full object-contain" />
        </div>
      </a>
    );
  }

  return (
    <div className="bg-slate-100 border border-slate-200 rounded-2xl h-56 sm:h-64 flex flex-col items-center justify-center gap-1.5">
      <User className="w-6 h-6 text-slate-300" />
      <p className="text-slate-400 font-medium text-center" style={{ fontSize: "0.65rem" }}>
        {label}
      </p>
      <p className="text-slate-300" style={{ fontSize: "0.58rem" }}>
        Not uploaded yet
      </p>
    </div>
  );
}

// Student detail modal

function StudentDetailModal({
  request,
  onClose,
  onApprove,
  onReject,
  isProcessing,
  processingAction,
}: {
  request: AdminStudentVerification;
  onClose: () => void;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  isProcessing: boolean;
  processingAction: "approve" | "reject" | null;
}) {
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
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-white flex items-center justify-between px-5 py-4 border-b border-black/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Student Verification Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold overflow-hidden"
              style={{ fontSize: "1rem" }}
            >
              {request.avatar ? (
                <img
                  src={request.avatar}
                  alt={`${request.name} avatar`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                request.initials
              )}
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                {request.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
                  {request.email}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: "College Name", value: request.collegeName },
              { label: "Student ID", value: request.studentId },
              { label: "Submitted", value: request.submittedAt },
              { label: "Status", value: STATUS_CFG[request.status].label },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="text-slate-400 font-semibold"
                  style={{
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </p>
                <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DocumentPlaceholder label="Student ID Card" fileUrl={request.collegeIdCard} />
            <DocumentPlaceholder label="Selfie with ID" fileUrl={request.studentSelfie} />
          </div>
        </div>
        {request.status === "pending" && (
          <div className="bg-white flex gap-3 px-5 py-4 shrink-0 border-t border-black/[0.05]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const success = await onApprove(request.id);
                if (success) onClose();
              }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
              style={{ fontSize: "0.875rem" }}
            >
              <CheckCircle className="w-4 h-4" />{" "}
              {isProcessing && processingAction === "approve"
                ? "Approving..."
                : "Approve Verification"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const success = await onReject(request.id);
                if (success) onClose();
              }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
              style={{ fontSize: "0.875rem" }}
            >
              <XCircle className="w-4 h-4" />{" "}
              {isProcessing && processingAction === "reject"
                ? "Rejecting..."
                : "Reject Verification"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Client KYC detail modal

function ClientDetailModal({
  request,
  onClose,
  onApprove,
  onReject,
  isProcessing,
  processingAction,
}: {
  request: AdminClientVerification;
  onClose: () => void;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  isProcessing: boolean;
  processingAction: "approve" | "reject" | null;
}) {
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
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-white flex items-center justify-between px-5 py-4 border-b border-black/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
              Client KYC Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Client info */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center text-white font-bold"
              style={{ fontSize: "1rem" }}
            >
              {request.initials}
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                {request.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
                  {request.email}
                </p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: "Full Legal Name", value: request.legalName },
              { label: "Phone Number", value: request.phone },
              { label: "Submitted", value: request.submittedAt },
              { label: "Status", value: STATUS_CFG[request.status].label },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="text-slate-400 font-semibold"
                  style={{
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </p>
                <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DocumentPlaceholder
              label="Citizenship Front Photo"
              fileUrl={request.citizenshipFront}
            />
            <DocumentPlaceholder
              label="Selfie Holding Citizenship"
              fileUrl={request.citizenshipSelfie}
            />
          </div>

          {(request.companyName || request.companyRegistrationDocument) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                Company Information
              </p>
              {request.companyName && (
                <div>
                  <p
                    className="text-slate-400 font-semibold"
                    style={{
                      fontSize: "0.62rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Company Name
                  </p>
                  <p
                    className="text-slate-900 font-semibold mt-0.5"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {request.companyName}
                  </p>
                </div>
              )}
              <DocumentPlaceholder
                label="Company Registration Doc"
                fileUrl={request.companyRegistrationDocument}
              />
            </div>
          )}
        </div>
        {request.status === "pending" && (
          <div className="bg-white flex gap-3 px-5 py-4 shrink-0 border-t border-black/[0.05]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const success = await onApprove(request.id);
                if (success) onClose();
              }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
              style={{ fontSize: "0.875rem" }}
            >
              <CheckCircle className="w-4 h-4" />{" "}
              {isProcessing && processingAction === "approve"
                ? "Approving..."
                : "Approve Verification"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const success = await onReject(request.id);
                if (success) onClose();
              }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
              style={{ fontSize: "0.875rem" }}
            >
              <XCircle className="w-4 h-4" />{" "}
              {isProcessing && processingAction === "reject"
                ? "Rejecting..."
                : "Reject Verification"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Shared list panel

function VerificationListPanel<
  T extends {
    id: string;
    name: string;
    initials: string;
    submittedAt: string;
    status: VerificationStatus;
  },
>({
  items,
  setItems,
  emptyIcon: EmptyIcon,
  emptyLabel,
  searchPlaceholder,
  avatarGradient,
  getMetaItems,
  renderDetailModal,
  onApproveRequest,
  onRejectRequest,
  onRefresh,
  onNotify,
}: {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  emptyIcon: ElementType;
  emptyLabel: string;
  searchPlaceholder: string;
  avatarGradient: string;
  getMetaItems: (item: T) => { icon: ElementType; label: string; value: string }[];
  renderDetailModal: (
    item: T,
    onClose: () => void,
    onApprove: (id: string) => Promise<boolean>,
    onReject: (id: string) => Promise<boolean>,
    isProcessing: boolean,
    processingAction: "approve" | "reject" | null
  ) => ReactNode;
  onApproveRequest: (id: string) => Promise<unknown>;
  onRejectRequest: (id: string) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  onNotify: (message: NotificationMessage) => void;
}) {
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<T | null>(null);
  const [processingId, setProcessingId] = useState("");
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);
  // Card and detail actions share this confirmation state before mutating verification status.
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: "approve" | "reject";
    closeDetails: boolean;
  } | null>(null);

  const updateLocalStatus = (id: string, status: VerificationStatus) => {
    // Reflect approval/rejection immediately while the list refresh catches up.
    setItems((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request))
    );
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const approve = async (id: string) => {
    if (processingId) return false;

    setProcessingId(id);
    setProcessingAction("approve");

    try {
      await onApproveRequest(id);
      updateLocalStatus(id, "approved");
      onNotify({ type: "success", text: "Verification approved successfully." });
      await onRefresh();
      window.dispatchEvent(new Event("skillbridge:verification-updated"));
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification could not be approved.";
      onNotify({ type: "error", text: message });
      return false;
    } finally {
      setProcessingId("");
      setProcessingAction(null);
    }
  };

  const reject = async (id: string) => {
    if (processingId) return false;

    setProcessingId(id);
    setProcessingAction("reject");

    try {
      await onRejectRequest(id);
      updateLocalStatus(id, "rejected");
      onNotify({ type: "success", text: "Verification rejected successfully." });
      await onRefresh();
      window.dispatchEvent(new Event("skillbridge:verification-updated"));
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification could not be rejected.";
      onNotify({ type: "error", text: message });
      return false;
    } finally {
      setProcessingId("");
      setProcessingAction(null);
    }
  };

  const requestActionConfirmation = (id: string, action: "approve" | "reject") => {
    if (processingId) return Promise.resolve(false);

    const request = items.find((item) => item.id === id);

    setConfirmAction({
      id,
      name: request?.name ?? "this user",
      action,
      closeDetails: selected?.id === id,
    });

    return Promise.resolve(false);
  };

  const confirmVerificationAction = async () => {
    if (!confirmAction) return;

    const success =
      confirmAction.action === "approve"
        ? await approve(confirmAction.id)
        : await reject(confirmAction.id);

    if (success) {
      if (confirmAction.closeDetails) {
        setSelected(null);
      }

      setConfirmAction(null);
    }
  };

  const counts = {
    all: items.length,
    pending: items.filter((request) => request.status === "pending").length,
    approved: items.filter((request) => request.status === "approved").length,
    rejected: items.filter((request) => request.status === "rejected").length,
  };

  const filtered = items.filter((request) => {
    const q = search.toLowerCase();
    // Keep filtering generic so the same panel can render student and client requests.
    const matchSearch = !q || request.name.toLowerCase().includes(q);
    const matchFilter = filter === "all" || request.status === filter;
    return matchSearch && matchFilter;
  });

  const FILTERS: { label: string; value: VerificationStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <>
      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />

      {/* Filters */}
      <FilterChipGroup
        items={FILTERS.map((f) => ({
          ...f,
          count: counts[f.value],
          config: f.value !== "all" ? STATUS_CFG[f.value] : undefined,
        }))}
        activeValue={filter}
        onChange={setFilter}
        showZeroCounts
      />

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
            <EmptyIcon className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
            {emptyLabel}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <VerificationCard
                  item={item}
                  avatarGradient={avatarGradient}
                  metaItems={getMetaItems(item)}
                  onView={setSelected}
                  onApprove={(id) => requestActionConfirmation(id, "approve")}
                  onReject={(id) => requestActionConfirmation(id, "reject")}
                  isProcessing={processingId === item.id}
                  processingAction={processingId === item.id ? processingAction : null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selected &&
          renderDetailModal(
            items.find((request) => request.id === selected.id) ?? selected,
            () => setSelected(null),
            (id) => requestActionConfirmation(id, "approve"),
            (id) => requestActionConfirmation(id, "reject"),
            processingId === selected.id,
            processingId === selected.id ? processingAction : null
          )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <ConfirmDialog
            align="center"
            busyDelayMs={0}
            icon={confirmAction.action === "approve" ? CheckCircle : XCircle}
            iconBg={confirmAction.action === "approve" ? "#ECFDF5" : "#FEF2F2"}
            iconColor={confirmAction.action === "approve" ? "#059669" : "#DC2626"}
            title={
              confirmAction.action === "approve" ? "Approve Verification?" : "Reject Verification?"
            }
            body={
              confirmAction.action === "approve"
                ? `Are you sure you want to approve ${confirmAction.name}'s verification request? This will mark the account as verified.`
                : `Are you sure you want to reject ${confirmAction.name}'s verification request? The account will remain unverified.`
            }
            confirmLabel={confirmAction.action === "approve" ? "Approve" : "Reject"}
            confirmColor={confirmAction.action === "approve" ? "#059669" : "#DC2626"}
            loading={processingId === confirmAction.id}
            onConfirm={confirmVerificationAction}
            onClose={() => {
              if (!processingId) setConfirmAction(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Main page

export default function AdminVerificationPage() {
  const [tab, setTab] = useState<"students" | "clients">("students");
  const [studentRequests, setStudentRequests] = useState<AdminStudentVerification[]>([]);
  const [clientRequests, setClientRequests] = useState<AdminClientVerification[]>([]);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const loadStudentVerifications = useCallback(async () => {
    const response = await getAdminStudentVerifications();

    setStudentRequests(
      response.data.map((request) => ({
        ...request,
        submittedAt: formatSubmittedDate(request.submittedAt),
      }))
    );
  }, []);

  const loadClientVerifications = useCallback(async () => {
    const response = await getAdminClientVerifications();

    setClientRequests(
      response.data.map((request) => ({
        ...request,
        submittedAt: formatSubmittedDate(request.submittedAt),
      }))
    );
  }, []);

  const loadVerifications = useCallback(async () => {
    // Refresh both tabs after any decision because pending counts are shared in the header.
    await Promise.all([loadStudentVerifications(), loadClientVerifications()]);
  }, [loadClientVerifications, loadStudentVerifications]);

  useEffect(() => {
    let ignore = false;

    const loadInitialVerifications = async () => {
      try {
        await Promise.all([loadStudentVerifications(), loadClientVerifications()]);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load verifications", error);
        }
      }
    };

    loadInitialVerifications();

    return () => {
      ignore = true;
    };
  }, [loadClientVerifications, loadStudentVerifications]);

  return (
    <>
      <DashboardLayout role="admin" title="Verification Management" activeNav="students">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-5"
        >
          {/* Header */}
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Verification Management
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Review and approve student and client verification requests.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 w-fit">
            {[
              {
                value: "students" as const,
                label: "Students",
                count: studentRequests.filter((request) => request.status === "pending").length,
              },
              {
                value: "clients" as const,
                label: "Clients",
                count: clientRequests.filter((request) => request.status === "pending").length,
              },
            ].map((t) => (
              <motion.button
                key={t.value}
                onClick={() => setTab(t.value)}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-all duration-200"
                style={{
                  background: tab === t.value ? "white" : "transparent",
                  color: tab === t.value ? "#0F172A" : "#64748B",
                  boxShadow: tab === t.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  fontSize: "0.82rem",
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className="px-1.5 py-px rounded-full font-bold"
                    style={{
                      background: tab === t.value ? "#EFF6FF" : "#E2E8F0",
                      color: tab === t.value ? "#2563EB" : "#94A3B8",
                      fontSize: "0.6rem",
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {tab === "students" ? (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <VerificationListPanel
                  items={studentRequests}
                  setItems={setStudentRequests}
                  emptyIcon={GraduationCap}
                  emptyLabel="No Student Verification Requests"
                  searchPlaceholder="Search by name, email, or university…"
                  avatarGradient="linear-gradient(135deg,#2563EB,#14B8A6)"
                  getMetaItems={(request) => [
                    {
                      icon: BookOpen,
                      label: "College Name",
                      value: request.collegeName,
                    },
                    { icon: Hash, label: "Student ID", value: request.studentId },
                    {
                      icon: Clock,
                      label: "Submitted",
                      value: request.submittedAt,
                    },
                  ]}
                  renderDetailModal={(
                    item,
                    onClose,
                    onApprove,
                    onReject,
                    isProcessing,
                    processingAction
                  ) => (
                    <StudentDetailModal
                      request={item}
                      onClose={onClose}
                      onApprove={onApprove}
                      onReject={onReject}
                      isProcessing={isProcessing}
                      processingAction={processingAction}
                    />
                  )}
                  onApproveRequest={approveVerification}
                  onRejectRequest={rejectVerification}
                  onRefresh={loadVerifications}
                  onNotify={setNotification}
                />
              </motion.div>
            ) : (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <VerificationListPanel
                  items={clientRequests}
                  setItems={setClientRequests}
                  emptyIcon={Briefcase}
                  emptyLabel="No Client KYC Requests"
                  searchPlaceholder="Search by name or email…"
                  avatarGradient="linear-gradient(135deg,#D97706,#F59E0B)"
                  getMetaItems={(request) => [
                    { icon: User, label: "Legal Name", value: request.legalName },
                    { icon: Phone, label: "Phone", value: request.phone },
                    {
                      icon: Clock,
                      label: "Submitted",
                      value: request.submittedAt,
                    },
                    ...(request.companyName
                      ? [{ icon: Briefcase, label: "Company", value: request.companyName }]
                      : []),
                  ]}
                  renderDetailModal={(
                    item,
                    onClose,
                    onApprove,
                    onReject,
                    isProcessing,
                    processingAction
                  ) => (
                    <ClientDetailModal
                      request={item}
                      onClose={onClose}
                      onApprove={onApprove}
                      onReject={onReject}
                      isProcessing={isProcessing}
                      processingAction={processingAction}
                    />
                  )}
                  onApproveRequest={approveVerification}
                  onRejectRequest={rejectVerification}
                  onRefresh={loadVerifications}
                  onNotify={setNotification}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DashboardLayout>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </>
  );
}
