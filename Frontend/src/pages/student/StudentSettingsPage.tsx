import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DashboardLayout,
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
import { Notification, type NotificationMessage } from "../../app/components/shared/ui";
import { getStudentProfile, updateStudentProfile } from "../../services/studentProfileService";
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
} from "lucide-react";

// Nav items

type SettingsSection = "profile" | "social" | "verification" | "account";

const NAV_ITEMS: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "profile", label: "Profile Information", icon: User },
  { id: "social", label: "Social Links", icon: Link2 },
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
}: {
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
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
        "Save Changes"
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
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [education, setEducation] = useState("");
  const [university, setUniversity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const response = await uploadAvatar(file);
      setAvatarUrl(response.data.avatar ?? "");
      window.dispatchEvent(new Event("skillbridge:user-updated"));
      onNotify({ type: "success", text: "Profile picture updated successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profile picture could not be updated.";
      onNotify({ type: "error", text: message });
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
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

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
        <SaveButton saving={saving} saved={saved} />
      </div>
    </form>
  );
}

// Social Links

function SocialSection({ onNotify }: { onNotify: (message: NotificationMessage) => void }) {
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
        <SaveButton saving={saving} saved={saved} />
      </div>
    </form>
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
          github: response.data.github ?? "",
          linkedin: response.data.linkedin ?? "",
          portfolio: response.data.portfolio ?? "",
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
