import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  DashboardLayout,
  isAccountSuspended,
  useDashboardCurrentUser,
} from "../../app/components/layout/DashboardLayout";
import { SettingsLayout } from "../../app/components/layout/SettingsLayout";
import { getProfile, setProfile, subscribeProfile } from "../../app/data/profileStore";
import { VerificationReminderCard } from "../../app/components/shared/VerificationReminderCard";
import {
  VerificationForm,
  VerificationSubmittedState,
} from "../../app/components/shared/VerificationForm";
import {
  getVerificationDisplayStatus,
  VerificationDocumentsSection,
  VerificationErrorMessage,
  VerificationHelpMessage,
  VerificationLoadingMessage,
  VerificationRejectionReason,
  VerificationStatusCard,
  type VerificationDisplayStatus,
  type VerificationStatusValue,
} from "../../app/components/shared/VerificationStatusCard";
import { PasswordChangeForm } from "../../app/components/shared/PasswordChangeForm";
import { FileAttachmentCard } from "../../app/components/shared/FileAttachmentCard";
import { FileUploadArea, type UploadedFile } from "../../app/components/shared/FileUploadArea";
import {
  ConfirmDialog,
  Notification,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  AVATAR_FILE_ACCEPT,
  AvatarCropModal,
  validateAvatarImageFile,
} from "../../app/components/shared/AvatarCropModal";
import {
  deleteStudentCertificate,
  getStudentCertificates,
  getStudentProfile,
  updateStudentCertificate,
  updateStudentProfile,
  uploadStudentCertificate,
  type StudentCertificate,
} from "../../services/studentProfileService";
import { updateAccountDetails, uploadAvatar } from "../../services/authService";
import { getVerificationStatus, type VerificationData } from "../../services/verificationService";
import {
  User,
  Link2,
  ShieldCheck,
  Lock,
  Check,
  Upload,
  X,
  Plus,
  Search,
  Github,
  Linkedin,
  Globe,
  AlertCircle,
  Award,
  CalendarDays,
  Edit3,
  Trash2,
} from "lucide-react";

// Nav items

type SettingsSection = "profile" | "social" | "certificates" | "verification" | "account";

const NAV_ITEMS: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "profile", label: "Profile Information", icon: User },
  { id: "social", label: "Social Links", icon: Link2 },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "verification", label: "Identity Verification", icon: ShieldCheck },
  { id: "account", label: "Account Settings", icon: Lock },
];

// Shared input style

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
        {text}
      </span>
      {required && (
        <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
          *
        </span>
      )}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return msg ? (
    <p className="text-red-500 font-medium" style={{ fontSize: "0.72rem" }}>
      {msg}
    </p>
  ) : null;
}

function SaveButton({
  saving,
  saved,
  disabled: dis,
  label = "Save Changes",
}: {
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={dis || saving}
      whileHover={!dis && !saving ? { scale: 1.02 } : {}}
      whileTap={!dis && !saving ? { scale: 0.97 } : {}}
      className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-100"
      style={{
        background: saved ? "#059669" : dis ? "#E2E8F0" : "#2563EB",
        border: dis ? "1px solid #CBD5E1" : "1px solid transparent",
        color: dis ? "#64748B" : "white",
        fontSize: "0.875rem",
        cursor: dis ? "not-allowed" : "pointer",
      }}
    >
      {saving ? (
        <motion.span
          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      ) : saved ? (
        <>
          <Check className="w-4 h-4" /> Saved!
        </>
      ) : (
        label
      )}
    </motion.button>
  );
}

// Skills combo box

const ALL_SKILLS = [
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "TailwindCSS",
  "Node.js",
  "Express.js",
  "MongoDB",
  "PostgreSQL",
  "Python",
  "Java",
  "Figma",
  "Adobe XD",
  "Canva",
  "Illustrator",
  "Photoshop",
  "UI Design",
  "UX Design",
  "Graphic Design",
  "MS PowerPoint",
  "MS Word",
  "Presentation Design",
  "Content Writing",
  "Technical Writing",
  "Video Editing",
  "Social Media",
];

const CHIP_COLORS = [
  { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  { bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
  { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  { bg: "#FFF1F2", color: "#E11D48", border: "#FECDD3" },
  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
];

function SkillsComboBox({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_SKILLS.filter((s) => (!q || s.toLowerCase().includes(q)) && !skills.includes(s));
  }, [query, skills]);

  const isCustom =
    query.trim() &&
    !ALL_SKILLS.some((s) => s.toLowerCase() === query.toLowerCase().trim()) &&
    !skills.includes(query.trim());

  const add = (skill: string) => {
    if (skills.length < 12) onChange([...skills, skill]);
    setQuery("");
  };
  const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

  return (
    <div className="flex flex-col gap-3">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {skills.map((skill, i) => {
              const c = CHIP_COLORS[i % CHIP_COLORS.length];
              return (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border"
                  style={{
                    background: c.bg,
                    color: c.color,
                    borderColor: c.border,
                    fontSize: "0.75rem",
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => remove(skill)}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search or add a skill..."
          className={`${inputCls} pl-10 pr-10`}
          style={{ fontSize: "0.875rem" }}
        />
        {isCustom && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              add(query.trim());
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            style={{ fontSize: "0.68rem" }}
          >
            <Plus className="w-2.5 h-2.5" /> Add
          </button>
        )}
        <AnimatePresence>
          {open && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.07] rounded-xl shadow-xl z-30 overflow-hidden max-h-44 overflow-y-auto"
            >
              {filtered.slice(0, 20).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(skill);
                  }}
                  className="w-full text-left px-4 py-2.5 text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  style={{ fontSize: "0.82rem" }}
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  {skill}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-slate-300" style={{ fontSize: "0.68rem" }}>
        {skills.length}/12 · Verified skills are earned through completed projects
      </p>
    </div>
  );
}

// Profile Information

function ProfileSection({ onNotify }: { onNotify: (message: NotificationMessage) => void }) {
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [education, setEducation] = useState("");
  const [university, setUniversity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate from store on mount
  useEffect(() => {
    const loadProfileFromStore = () => {
      const p = getProfile();
      setDisplayName((prev) => prev || currentUser?.fullName || "");
      setAbout(p.bio);
      setEducation(p.education);
      setUniversity(p.university);
      setSkills(p.skills);
      setAvatarUrl(currentUser?.avatar ?? "");
    };

    loadProfileFromStore();
    return subscribeProfile(loadProfileFromStore);
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (suspended) {
      onNotify({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    const validationMessage = validateAvatarImageFile(file);

    if (validationMessage) {
      onNotify({ type: "error", text: validationMessage });
      return;
    }

    setSelectedAvatarFile(file);
  };

  const handleCroppedAvatarSave = async (file: File) => {
    setAvatarUploading(true);

    try {
      const response = await uploadAvatar(file);
      setAvatarUrl(response.data.avatar ?? "");
      setSelectedAvatarFile(null);
      window.dispatchEvent(new Event("skillbridge:user-updated"));
      onNotify({ type: "success", text: "Profile picture updated successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profile picture could not be updated.";
      onNotify({ type: "error", text: message });
    } finally {
      setAvatarUploading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Name is required.";
    if (!about.trim()) e.about = "About section is required.";
    if (!education.trim()) e.education = "Education is required.";
    if (!university.trim()) e.university = "University is required.";
    if (skills.length === 0) e.skills = "At least one skill is required.";
    return e;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suspended) {
      onNotify({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!currentUser?.email) {
      onNotify({ type: "error", text: "Current user could not be loaded." });
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const accountResponse = await updateAccountDetails({
        fullName: displayName,
        email: currentUser?.email ?? "",
      });

      const response = await updateStudentProfile({
        bio: about,
        education,
        university,
        skills,
      });

      const updatedProfile = response.data;

      setProfile({
        bio: updatedProfile.bio ?? about,
        education: updatedProfile.education ?? education,
        university: updatedProfile.university ?? university,
        skills: updatedProfile.skills ?? skills,
        verifiedSkills: updatedProfile.verifiedSkills ?? [],
      });
      // Notify the dashboard shell so avatar/name changes update immediately.
      window.dispatchEvent(new Event("skillbridge:user-updated"));
      setSaving(false);
      setSaved(true);
      onNotify({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile could not be updated.";
      setSaving(false);
      onNotify({ type: "error", text: message });
    }
  };

  const initials = displayName.trim()
    ? displayName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Profile Information
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          This information is displayed on your public profile.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold"
              style={{ fontSize: "1rem" }}
            >
              {initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
            Profile Picture
          </p>
          <p className="text-slate-400 mt-0.5 mb-2" style={{ fontSize: "0.72rem" }}>
            JPG or PNG · Max 2 MB
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
            style={{ fontSize: "0.75rem" }}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_FILE_ACCEPT}
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {selectedAvatarFile && (
        <AvatarCropModal
          file={selectedAvatarFile}
          initials={initials}
          currentAvatar={avatarUrl}
          loading={avatarUploading}
          onClose={() => {
            if (!avatarUploading) setSelectedAvatarFile(null);
          }}
          onSave={handleCroppedAvatarSave}
        />
      )}

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel text="Name" required />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your full name"
            className={inputCls}
            style={{ fontSize: "0.875rem" }}
          />
          <ErrorMsg msg={errors.displayName ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel text="About" required />
          <textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Describe yourself professionally — clients will see this on your profile."
            className={`${inputCls} resize-none`}
            style={{ fontSize: "0.875rem" }}
          />
          <ErrorMsg msg={errors.about ?? ""} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Degree / Education" required />
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Bachelor of Computer Engineering"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.education ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="University" required />
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. Kathmandu University"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.university ?? ""} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel text="Skills" required />
          <SkillsComboBox skills={skills} onChange={setSkills} />
          <ErrorMsg msg={errors.skills ?? ""} />
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-600" style={{ fontSize: "0.78rem" }}>
            Please complete all required fields before saving.
          </p>
        </div>
      )}

      <div className="pt-1 border-t border-black/[0.05]">
        <SaveButton
          saving={saving}
          saved={saved}
          disabled={suspended}
          label={suspended ? "Account Suspended" : "Save Changes"}
        />
      </div>
    </form>
  );
}

// Social Links

function SocialSection({ onNotify }: { onNotify: (message: NotificationMessage) => void }) {
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfileFromStore = () => {
      const p = getProfile();
      setGithub(p.github);
      setLinkedin(p.linkedin);
      setPortfolio(p.portfolio);
    };

    loadProfileFromStore();
    return subscribeProfile(loadProfileFromStore);
  }, []);

  const normalizeUrl = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return "";

    if (
      trimmedValue.toLowerCase().startsWith("http://") ||
      trimmedValue.toLowerCase().startsWith("https://")
    ) {
      return trimmedValue;
    }

    return `https://${trimmedValue}`;
  };

  const isValidUrl = (value: string) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname.includes(".") &&
        /[a-z]/i.test(url.hostname)
      );
    } catch (error) {
      return false;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};

    const normalizedGithub = normalizeUrl(github);
    const normalizedLinkedin = normalizeUrl(linkedin);
    const normalizedPortfolio = normalizeUrl(portfolio);

    if (!isValidUrl(normalizedGithub)) e.github = "Enter a valid URL";
    if (!isValidUrl(normalizedLinkedin)) e.linkedin = "Enter a valid URL";
    if (!isValidUrl(normalizedPortfolio)) e.portfolio = "Enter a valid URL";

    return {
      errors: e,
      values: {
        github: normalizedGithub,
        linkedin: normalizedLinkedin,
        portfolio: normalizedPortfolio,
      },
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suspended) {
      onNotify({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    const result = validate();
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;

    setSaving(true);
    setSaved(false);

    try {
      const response = await updateStudentProfile(result.values);
      const updatedProfile = response.data;

      setProfile({
        github: updatedProfile.github ?? result.values.github,
        linkedin: updatedProfile.linkedin ?? result.values.linkedin,
        portfolio: updatedProfile.portfolio ?? result.values.portfolio,
      });
      setGithub(updatedProfile.github ?? result.values.github);
      setLinkedin(updatedProfile.linkedin ?? result.values.linkedin);
      setPortfolio(updatedProfile.portfolio ?? result.values.portfolio);
      setSaving(false);
      setSaved(true);
      onNotify({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile could not be updated.";
      setSaving(false);
      onNotify({ type: "error", text: message });
    }
  };

  const fields = [
    {
      icon: Github,
      key: "github",
      label: "GitHub URL",
      value: github,
      set: setGithub,
      type: "text",
      placeholder: "https://github.com/username",
    },
    {
      icon: Linkedin,
      key: "linkedin",
      label: "LinkedIn URL",
      value: linkedin,
      set: setLinkedin,
      type: "text",
      placeholder: "https://linkedin.com/in/username",
    },
    {
      icon: Globe,
      key: "portfolio",
      label: "Portfolio Website",
      value: portfolio,
      set: setPortfolio,
      type: "text",
      placeholder: "https://yourportfolio.com",
    },
  ];

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Social Links
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Links appear as icons on your public profile. Empty fields won't be shown.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="flex flex-col gap-1.5">
              <FieldLabel text={f.label} />
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className={`${inputCls} pl-10`}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <ErrorMsg msg={errors[f.key] ?? ""} />
            </div>
          );
        })}
      </div>

      <div className="pt-1 border-t border-black/[0.05]">
        <SaveButton
          saving={saving}
          saved={saved}
          disabled={suspended}
          label={suspended ? "Account Suspended" : "Save Changes"}
        />
      </div>
    </form>
  );
}

// Certificates

const CERTIFICATE_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const CERTIFICATE_TYPES = ["application/pdf", "image/png", "image/jpg", "image/jpeg"];
const CERTIFICATE_MAX_SIZE = 5 * 1024 * 1024;

function formatCertificateDate(value?: string | null) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateInputValue(value?: string | null) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
}

function CertificateSection({ onNotify }: { onNotify: (message: NotificationMessage) => void }) {
  const currentUser = useDashboardCurrentUser();
  const suspended = isAccountSuspended(currentUser);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [title, setTitle] = useState("");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [editingId, setEditingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StudentCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const editingCertificate = certificates.find((certificate) => certificate.id === editingId);

  const resetForm = () => {
    setTitle("");
    setIssuingOrganization("");
    setIssueDate("");
    setExpiryDate("");
    setCredentialId("");
    setCredentialUrl("");
    setFiles([]);
    setEditingId("");
    setErrors({});
  };

  const loadCertificates = async () => {
    setLoading(true);

    try {
      const response = await getStudentCertificates();
      setCertificates(response.data.certificates);
      setProfile({ certificates: response.data.certificates });
    } catch (error) {
      onNotify({
        type: "error",
        text: error instanceof Error ? error.message : "Certificates could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // Certificates are loaded once when the section opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (file: UploadedFile) => {
    if (!CERTIFICATE_TYPES.includes(file.type)) {
      return "Only PDF, JPG, JPEG and PNG certificate files are allowed.";
    }

    if (file.size > CERTIFICATE_MAX_SIZE) {
      return "Certificate file must be 5 MB or smaller.";
    }

    return "";
  };

  const handleAddFile = (file: UploadedFile) => {
    const fileError = validateFile(file);

    if (fileError) {
      setErrors((current) => ({ ...current, file: fileError }));
      return;
    }

    setErrors((current) => ({ ...current, file: "" }));
    setFiles([file]);
  };

  const normalizeUrl = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return "";

    if (
      trimmedValue.toLowerCase().startsWith("http://") ||
      trimmedValue.toLowerCase().startsWith("https://")
    ) {
      return trimmedValue;
    }

    return `https://${trimmedValue}`;
  };

  const isValidUrl = (value: string) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname.includes(".") &&
        /[a-z]/i.test(url.hostname)
      );
    } catch {
      return false;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const normalizedUrl = normalizeUrl(credentialUrl);
    const duplicate = certificates.some((certificate) => {
      if (editingId && certificate.id === editingId) return false;

      return (
        certificate.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        certificate.issuingOrganization.trim().toLowerCase() ===
          issuingOrganization.trim().toLowerCase()
      );
    });

    if (!title.trim()) e.title = "Certificate title is required.";
    if (!issuingOrganization.trim()) {
      e.issuingOrganization = "Issuing organization is required.";
    }
    if (!issueDate) e.issueDate = "Issue date is required.";
    if (expiryDate && issueDate && new Date(expiryDate) < new Date(issueDate)) {
      e.expiryDate = "Expiry date cannot be before issue date.";
    }
    if (!editingId && files.length === 0) e.file = "Certificate file is required.";
    if (files[0]) {
      const fileError = validateFile(files[0]);
      if (fileError) e.file = fileError;
    }
    if (!isValidUrl(normalizedUrl)) e.credentialUrl = "Enter a valid URL.";
    if (duplicate) {
      e.title = "This certificate already exists.";
      e.issuingOrganization = "This certificate already exists.";
    }

    return {
      errors: e,
      credentialUrl: normalizedUrl,
    };
  };

  const handleEdit = (certificate: StudentCertificate) => {
    setTitle(certificate.title);
    setIssuingOrganization(certificate.issuingOrganization);
    setIssueDate(getDateInputValue(certificate.issueDate));
    setExpiryDate(getDateInputValue(certificate.expiryDate));
    setCredentialId(certificate.credentialId ?? "");
    setCredentialUrl(certificate.credentialUrl ?? "");
    setFiles([]);
    setEditingId(certificate.id);
    setErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suspended) {
      onNotify({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      return;
    }

    const result = validate();
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;

    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        title,
        issuingOrganization,
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl: result.credentialUrl,
        file: files[0]?.file,
      };

      const response = editingId
        ? await updateStudentCertificate(editingId, payload)
        : await uploadStudentCertificate({ ...payload, file: files[0].file });

      const nextCertificates = editingId
        ? certificates.map((certificate) =>
            certificate.id === editingId ? response.data : certificate
          )
        : [response.data, ...certificates];

      setCertificates(nextCertificates);
      setProfile({ certificates: nextCertificates });
      resetForm();
      setSaving(false);
      setSaved(true);
      onNotify({ type: "success", text: response.message });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaving(false);
      onNotify({
        type: "error",
        text: error instanceof Error ? error.message : "Certificate could not be saved.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (suspended) {
      onNotify({ type: "error", text: ACCOUNT_SUSPENDED_MESSAGE });
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);

    try {
      const response = await deleteStudentCertificate(deleteTarget.id);
      const nextCertificates = certificates.filter(
        (certificate) => certificate.id !== deleteTarget.id
      );

      setCertificates(nextCertificates);
      setProfile({ certificates: nextCertificates });
      setDeleteTarget(null);
      onNotify({ type: "success", text: response.message });

      if (editingId === deleteTarget.id) {
        resetForm();
      }
    } catch (error) {
      onNotify({
        type: "error",
        text: error instanceof Error ? error.message : "Certificate could not be deleted.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Certificates
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Add certificates that clients can view from your profile.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Certificate Title" required />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Frontend Development"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.title ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Issuing Organization" required />
            <input
              value={issuingOrganization}
              onChange={(e) => setIssuingOrganization(e.target.value)}
              placeholder="e.g. Coursera"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.issuingOrganization ?? ""} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Issue Date" required />
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.issueDate ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Expiry Date" />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.expiryDate ?? ""} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Credential ID" />
            <input
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="Optional credential identifier"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel text="Credential URL" />
            <input
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://credential-link.com"
              className={inputCls}
              style={{ fontSize: "0.875rem" }}
            />
            <ErrorMsg msg={errors.credentialUrl ?? ""} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            text={editingId ? "Replacement File" : "Certificate File"}
            required={!editingId}
          />
          {editingCertificate?.file && files.length === 0 && (
            <FileAttachmentCard attachment={editingCertificate.file} />
          )}
          <FileUploadArea
            files={files}
            onAdd={handleAddFile}
            onRemove={(name) => setFiles((current) => current.filter((file) => file.name !== name))}
            maxFiles={1}
            accept={CERTIFICATE_ACCEPT}
            disabled={suspended}
          />
          <p className="text-slate-300" style={{ fontSize: "0.68rem" }}>
            PDF, JPG, JPEG or PNG · Max 5 MB
          </p>
          <ErrorMsg msg={errors.file ?? ""} />
        </div>

        <div className="pt-1 border-t border-black/[0.05] flex items-center gap-3 flex-wrap">
          <SaveButton
            saving={saving}
            saved={saved}
            disabled={suspended}
            label={
              suspended
                ? "Account Suspended"
                : editingId
                  ? "Update Certificate"
                  : "Upload Certificate"
            }
          />
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-500 font-semibold hover:text-slate-900 transition-colors"
              style={{ fontSize: "0.82rem" }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="border-t border-black/[0.05] pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.span
              className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 text-center">
            <Award className="w-7 h-7 text-slate-300" />
            <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>
              No certificates added yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-900 font-semibold" style={{ fontSize: "0.85rem" }}>
                      {certificate.title}
                    </p>
                    <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.72rem" }}>
                      {certificate.issuingOrganization}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(certificate)}
                      disabled={suspended}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      aria-label={`Edit ${certificate.title}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(certificate)}
                      disabled={suspended}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label={`Delete ${certificate.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span style={{ fontSize: "0.68rem" }}>
                    Issued {formatCertificateDate(certificate.issueDate)}
                    {certificate.expiryDate
                      ? ` · Expires ${formatCertificateDate(certificate.expiryDate)}`
                      : ""}
                  </span>
                </div>
                {certificate.credentialId && (
                  <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                    Credential ID: {certificate.credentialId}
                  </p>
                )}
                <FileAttachmentCard attachment={certificate.file} />
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Certificate"
          body={`Are you sure you want to delete "${deleteTarget.title}"?`}
          confirmLabel="Delete Certificate"
          confirmColor="#DC2626"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

// Identity Verification

function VerificationSection({ onNotify }: { onNotify: (message: NotificationMessage) => void }) {
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<VerificationStatusValue>("pending");
  const verificationStatus = getVerificationDisplayStatus(verification?.status ?? null);
  const canSubmit = verificationStatus === "not-verified" || verificationStatus === "rejected";

  useEffect(() => {
    let mounted = true;

    const loadVerificationStatus = async () => {
      setLoadingVerification(true);
      setVerificationError("");

      try {
        const response = await getVerificationStatus();

        if (!mounted) return;

        setVerification(response.data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Verification status could not be loaded.";

        if (mounted) {
          setVerificationError(message);
        }
      } finally {
        if (mounted) {
          setLoadingVerification(false);
        }
      }
    };

    loadVerificationStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const reloadVerificationStatus = async () => {
    try {
      const response = await getVerificationStatus();
      setVerification(response.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification status could not be loaded.";
      setVerificationError(message);
    }
  };

  const handleSubmitted = (submittedVerification: VerificationData) => {
    setSubmitted(true);
    setSubmittedStatus(submittedVerification.status);
    setVerification(submittedVerification);
    // Reload from the API so the local status mirrors backend review state.
    reloadVerificationStatus();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Identity Verification
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Verify your student identity to build trust with clients and unlock platform features.
        </p>
      </div>
      {loadingVerification ? (
        <VerificationLoadingMessage />
      ) : verificationError ? (
        <VerificationErrorMessage message={verificationError} />
      ) : (
        <>
          <VerificationStatusCard status={verificationStatus} />
          {submitted ? (
            <VerificationDocumentsSection>
              <VerificationSubmittedState status={submittedStatus} />
            </VerificationDocumentsSection>
          ) : canSubmit ? (
            <VerificationDocumentsSection>
              {verificationStatus === "rejected" && verification?.rejectionReason && (
                <VerificationRejectionReason reason={verification.rejectionReason} />
              )}
              <VerificationForm
                initialUniversity={verification?.collegeName ?? ""}
                initialStudentId={verification?.studentId ?? ""}
                mode={verificationStatus === "rejected" ? "update" : "submit"}
                onSubmitted={handleSubmitted}
                onNotify={onNotify}
              />
            </VerificationDocumentsSection>
          ) : (
            <VerificationHelpMessage status={verificationStatus} />
          )}
        </>
      )}
    </div>
  );
}

// Account Settings

function AccountSection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Account Settings
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Manage your account security.
        </p>
      </div>

      <PasswordChangeForm />
    </div>
  );
}

// Main page

export default function StudentSettingsPage() {
  const [active, setActive] = useState<SettingsSection>("profile");
  const [notification, setNotification] = useState<NotificationMessage>(null);

  useEffect(() => {
    let mounted = true;

    const loadStudentProfile = async () => {
      try {
        const response = await getStudentProfile();

        if (!mounted || !response.data) return;

        setProfile({
          bio: response.data.bio ?? "",
          education: response.data.education ?? "",
          university: response.data.university ?? "",
          skills: response.data.skills ?? [],
          verifiedSkills: response.data.verifiedSkills ?? [],
          github: response.data.github ?? "",
          linkedin: response.data.linkedin ?? "",
          portfolio: response.data.portfolio ?? "",
          certificates: response.data.certificates ?? [],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Student profile could not be loaded.";
        if (mounted) {
          setNotification({ type: "error", text: message });
        }
      }
    };

    loadStudentProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const CONTENT: Record<SettingsSection, React.ReactNode> = {
    profile: <ProfileSection onNotify={setNotification} />,
    social: <SocialSection onNotify={setNotification} />,
    certificates: <CertificateSection onNotify={setNotification} />,
    verification: <VerificationSection onNotify={setNotification} />,
    account: <AccountSection />,
  };

  return (
    <DashboardLayout role="student" title="Settings" activeNav="settings">
      <SettingsLayout
        navTitle="Settings"
        items={NAV_ITEMS}
        activeId={active}
        onSelect={setActive}
        topContent={<VerificationReminderCard />}
      >
        {CONTENT[active]}
      </SettingsLayout>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
