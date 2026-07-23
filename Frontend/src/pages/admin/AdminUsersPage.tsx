import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  FileWarning,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { FilterChipGroup, SearchInput, StatusBadge } from "../../app/components/shared/ui";
import { PLATFORM_USERS, type PlatformUser, type UserStatus } from "../../app/data/admin";
import { AdminUserProfileModal } from "./AdminUserProfileModal";

const STATUS_CFG: Record<
  UserStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  suspended: {
    label: "Suspended",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
};

const ROLE_CFG = {
  student: {
    label: "Student",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: GraduationCap,
  },
  client: {
    label: "Client",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    icon: Briefcase,
  },
};

function UserCard({ user, onViewDetails }: { user: PlatformUser; onViewDetails: () => void }) {
  const statusCfg = STATUS_CFG[user.status];
  const roleCfg = ROLE_CFG[user.role];
  const RoleIcon = roleCfg.icon;
  const ReportsIcon = user.pendingReports > 0 ? FileWarning : ShieldCheck;
  const isVerified = user.verificationStatus === "approved";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:border-blue-200 p-4 flex flex-col gap-3 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
            style={{ fontSize: "0.65rem" }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.initials
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-slate-900 font-bold truncate" style={{ fontSize: "0.86rem" }}>
                {user.name}
              </p>
              {isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </div>
            <p className="text-slate-500 truncate" style={{ fontSize: "0.7rem" }}>
              {user.email}
            </p>
          </div>
        </div>
        <StatusBadge config={statusCfg} style={{ fontSize: "0.58rem" }} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold"
          style={{
            background: roleCfg.bg,
            color: roleCfg.color,
            borderColor: roleCfg.border,
            fontSize: "0.66rem",
          }}
        >
          <RoleIcon className="w-3 h-3" /> {roleCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ReportsIcon className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ fontSize: "0.62rem" }}>
              Reports
            </span>
          </div>
          <p className="text-slate-900 font-bold mt-1" style={{ fontSize: "0.78rem" }}>
            {user.reportsReceived}
            <span className="text-slate-400 font-semibold ml-1" style={{ fontSize: "0.62rem" }}>
              total
            </span>
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ fontSize: "0.62rem" }}>
              Joined
            </span>
          </div>
          <p className="text-slate-900 font-semibold mt-1" style={{ fontSize: "0.72rem" }}>
            {user.joinedAt}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 font-semibold py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
        style={{ fontSize: "0.75rem" }}
      >
        <Eye className="w-3.5 h-3.5" /> View Details
      </button>
    </motion.div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "client">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const users = PLATFORM_USERS;
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    return (
      matchSearch &&
      (roleFilter === "all" || u.role === roleFilter) &&
      (statusFilter === "all" || u.status === statusFilter)
    );
  });

  return (
    <DashboardLayout role="admin" title="Users" activeNav="users">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Platform Users
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Manage student and client accounts from one admin view.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {users.length} users
            </span>
          </div>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />

        <div className="flex flex-wrap gap-2">
          <FilterChipGroup
            items={[
              { label: "All", value: "all" },
              { label: "Students", value: "student" },
              { label: "Clients", value: "client" },
            ]}
            activeValue={roleFilter}
            onChange={setRoleFilter}
          />
          <div className="w-px h-6 bg-slate-200 self-center mx-1" />
          <FilterChipGroup
            items={[
              { label: "Active", value: "active", config: STATUS_CFG.active },
              {
                label: "Suspended",
                value: "suspended",
                config: STATUS_CFG.suspended,
              },
            ]}
            activeValue={statusFilter}
            onChange={(value) => setStatusFilter((prev) => (prev === value ? "all" : value))}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Users className="w-9 h-9 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                No Users Found
              </p>
              <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
                Try adjusting your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <UserCard user={user} onViewDetails={() => setSelectedUserId(user.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <AdminUserProfileModal user={selectedUser} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
