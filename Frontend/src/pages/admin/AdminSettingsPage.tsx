import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Settings, Lock, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { SettingsLayout } from "../../app/components/layout/SettingsLayout";
import {
  ConfirmDialog,
  Notification,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  setPlatformSettings,
  usePlatformSettings,
} from "../../app/data/platformSettingsStore";
import { changePassword } from "../../services/authService";
import {
  getAdminSettings,
  updateGeneralSettings,
  updateMaintenanceSettings,
} from "../../services/adminService";

type Section = "general" | "security";

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "security", label: "Security", icon: Lock },
];

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

function SaveButton({
  saving,
  saved,
  label = "Save Changes",
}: {
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={saving}
      whileHover={!saving ? { scale: 1.02 } : {}}
      whileTap={!saving ? { scale: 0.97 } : {}}
      className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60"
      style={{
        background: saved ? "#059669" : "#2563EB",
        color: "white",
        fontSize: "0.875rem",
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

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-60"
      style={{ background: on ? "#2563EB" : "#E2E8F0" }}
    >
      <motion.span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: on ? "22px" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

function GeneralSection() {
  const platformSettings = usePlatformSettings();
  const [name, setName] = useState(platformSettings.platformName);
  const [email, setEmail] = useState(platformSettings.supportEmail);
  const [desc, setDesc] = useState(platformSettings.platformDescription);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  useEffect(() => {
    setName(platformSettings.platformName);
    setEmail(platformSettings.supportEmail);
    setDesc(platformSettings.platformDescription);
  }, [
    platformSettings.platformDescription,
    platformSettings.platformName,
    platformSettings.supportEmail,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setNotification(null);
      setSaving(true);

      const response = await updateGeneralSettings({
        platformName: name,
        supportEmail: email,
        platformDescription: desc,
      });

      setPlatformSettings(response.data);
      setSaving(false);
      setSaved(true);
      setNotification({ type: "success", text: response.message });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaving(false);
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "General settings could not be updated.",
      });
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          General
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Platform-level configuration settings.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel text="Platform Name" required />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel text="Support Email" required />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel text="Platform Description" />
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={`${inputCls} resize-none`}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>
      <div className="pt-1 border-t border-black/[0.05]">
        <SaveButton saving={saving} saved={saved} />
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </form>
  );
}

// Security settings call real APIs for password and maintenance mode changes.

function SecuritySection() {
  const platformSettings = usePlatformSettings();
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    platformSettings.maintenanceMessage
  );
  const [maintenanceDraft, setMaintenanceDraft] = useState("");
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceSaved, setMaintenanceSaved] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const pwMatch = newPw && confirm && newPw === confirm;

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const response = await getAdminSettings();

        if (!ignore) {
          setMaintenance(response.data.maintenanceMode);
          setMaintenanceMessage(response.data.maintenanceMessage);
          setPlatformSettings(response.data);
        }
      } catch (error) {
        if (!ignore) {
          setNotification({
            type: "error",
            text: error instanceof Error ? error.message : "Admin settings could not be loaded.",
          });
        }
      }
    };

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  const saveMaintenanceSettings = async (
    nextMaintenance: boolean,
    nextMessage: string,
    rollbackMaintenance?: boolean
  ) => {
    setNotification(null);

    try {
      setMaintenanceSaving(true);
      const response = await updateMaintenanceSettings({
        maintenanceMode: nextMaintenance,
        maintenanceMessage: nextMessage,
      });

      setMaintenance(response.data.maintenanceMode);
      setMaintenanceMessage(response.data.maintenanceMessage);
      setPlatformSettings(response.data);
      setMaintenanceSaved(true);
      setNotification({ type: "success", text: response.message });
      setTimeout(() => setMaintenanceSaved(false), 3000);
      return true;
    } catch (error) {
      if (rollbackMaintenance !== undefined) {
        setMaintenance(rollbackMaintenance);
      }

      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "Maintenance settings could not be updated.",
      });
      return false;
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleMaintenanceToggle = () => {
    if (maintenanceSaving) return;

    const nextMaintenance = !maintenance;
    if (nextMaintenance) {
      setMaintenanceDraft("");
      setShowMaintenanceConfirm(true);
      return;
    }

    setMaintenance(nextMaintenance);
    saveMaintenanceSettings(nextMaintenance, maintenanceMessage, maintenance);
  };

  const handleMaintenanceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMaintenanceSettings(maintenance, maintenanceMessage);
  };

  const confirmEnableMaintenance = async () => {
    const success = await saveMaintenanceSettings(true, maintenanceDraft.trim());

    if (success) {
      setShowMaintenanceConfirm(false);
      setMaintenanceDraft("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!current.trim()) {
      setNotification({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    if (!newPw.trim()) {
      setNotification({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    if (!confirm.trim()) {
      setNotification({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    if (newPw !== confirm) {
      setNotification({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        oldPassword: current,
        newPassword: newPw,
      });

      setSaving(false);
      setSaved(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
      setNotification({ type: "success", text: "Password changed successfully." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaving(false);
      const message = error instanceof Error ? error.message : "";
      const text =
        message === "Invalid old password"
          ? "Current password is incorrect."
          : "Failed to change password. Please try again.";

      setNotification({ type: "error", text });
    }
  };

  const passwordPlaceholder = (label: string) =>
    label === "Current Password"
      ? "Enter your current password"
      : label === "New Password"
        ? "Enter your new password"
        : "Re-enter your new password";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
          Security
        </h2>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
          Manage admin account security and platform access.
        </p>
      </div>

      {/* Maintenance toggle */}
      <form onSubmit={handleMaintenanceSave} className="flex flex-col gap-3">
        <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
          Maintenance Mode
        </p>
        <div className="flex items-center justify-between py-3 border-b border-black/[0.04]">
          <div>
            <p className="text-slate-900 font-semibold" style={{ fontSize: "0.85rem" }}>
              Enable Maintenance Mode
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              Temporarily restrict platform access for all users.
            </p>
          </div>
          <Toggle
            on={maintenance}
            onChange={handleMaintenanceToggle}
            disabled={maintenanceSaving}
          />
        </div>
        {maintenance && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-amber-100 border border-amber-200 rounded-xl px-4 py-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-600" style={{ fontSize: "0.78rem" }}>
              <span className="font-bold">Maintenance mode is ON.</span> All users will see a
              maintenance message.
            </p>
          </motion.div>
        )}
      </form>

      {/* Password */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
          Change Password
        </p>
        {(
          [
            ["Current Password", current, setCurrent, showCur, () => setShowCur((v) => !v)],
            ["New Password", newPw, setNewPw, showNew, () => setShowNew((v) => !v)],
            ["Confirm Password", confirm, setConfirm, showCon, () => setShowCon((v) => !v)],
          ] as [string, string, (v: string) => void, boolean, () => void][]
        ).map(([label, val, set, show, toggle]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <FieldLabel text={label} required />
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={passwordPlaceholder(label)}
                className={`${inputCls} pr-10`}
                style={{ fontSize: "0.875rem" }}
              />
              <button
                type="button"
                onClick={toggle}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        {newPw && confirm && !pwMatch && (
          <p className="text-red-500" style={{ fontSize: "0.72rem" }}>
            Passwords do not match.
          </p>
        )}
        <div className="pt-1 border-t border-black/[0.05]">
          <SaveButton saving={saving} saved={saved} label="Update Security Settings" />
        </div>
      </form>
      {showMaintenanceConfirm && (
        <ConfirmDialog
          align="left"
          busyDelayMs={0}
          icon={AlertTriangle}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          maxWidthClassName="max-w-md"
          title="Enable Maintenance Mode?"
          body={
            <div className="flex flex-col gap-4">
              <p>
                This will temporarily prevent students, clients, and visitors from using
                {platformSettings.platformName}.
              </p>
              <div className="flex flex-col gap-1.5 text-left">
                <FieldLabel text="Optional Message" />
                <textarea
                  rows={4}
                  value={maintenanceDraft}
                  onChange={(e) => setMaintenanceDraft(e.target.value)}
                  placeholder="Write a short message users will see during maintenance."
                  className={`${inputCls} resize-none`}
                  style={{ fontSize: "0.875rem" }}
                  disabled={maintenanceSaving}
                />
              </div>
            </div>
          }
          confirmLabel="Enable"
          confirmColor="#D97706"
          loading={maintenanceSaving}
          onConfirm={confirmEnableMaintenance}
          onClose={() => {
            if (!maintenanceSaving) {
              setShowMaintenanceConfirm(false);
              setMaintenanceDraft("");
            }
          }}
        />
      )}
      <Notification message={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [active, setActive] = useState<Section>("general");

  const CONTENT: Record<Section, React.ReactNode> = {
    general: <GeneralSection />,
    security: <SecuritySection />,
  };

  return (
    <DashboardLayout role="admin" title="Platform Settings" activeNav="settings">
      <SettingsLayout navTitle="Settings" items={NAV_ITEMS} activeId={active} onSelect={setActive}>
        {CONTENT[active]}
      </SettingsLayout>
    </DashboardLayout>
  );
}
