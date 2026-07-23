import {
  Building2,
  CheckCircle,
  ExternalLink,
  MapPin,
  Briefcase,
  FolderCheck,
  CalendarDays,
  Star,
} from "lucide-react";
import { ReportUserAction } from "./ReportUserAction";

export interface ClientCardData {
  id?: string;
  fullName: string;
  location?: string;
  avatar?: string;
  joined?: string;
  companyName?: string;
  website?: string;
  bio?: string;
  verification?: {
    status: string | null;
    verifiedAt?: string | null;
  };
  statistics?: {
    jobsPosted?: number | null;
    projectsCompleted?: number | null;
    activeProjects?: number | null;
    totalReviews?: number | null;
    averageRating?: number | null;
  };
}

function formatJoinedDate(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getWebsiteUrl(website?: string) {
  const trimmedWebsite = website?.trim();

  if (!trimmedWebsite) return "";

  if (trimmedWebsite.startsWith("http://") || trimmedWebsite.startsWith("https://")) {
    return trimmedWebsite;
  }

  // Allow users to save domains without a protocol while keeping links clickable.
  return `https://${trimmedWebsite}`;
}

/**
 * Displays the public client summary used inside job and project detail views.
 */
export function ClientInformationCard({
  client,
  showReportAction = false,
}: {
  client: ClientCardData;
  showReportAction?: boolean;
}) {
  const initials = client.fullName.slice(0, 2).toUpperCase();
  const joinedDate = formatJoinedDate(client.joined);
  const websiteUrl = getWebsiteUrl(client.website);
  const jobsPosted = client.statistics?.jobsPosted;
  const projectsCompleted = client.statistics?.projectsCompleted;
  const averageRating = client.statistics?.averageRating;
  const isVerified = client.verification?.status === "approved";
  const hasStats =
    jobsPosted != null || projectsCompleted != null || joinedDate || averageRating != null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
      <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
        About the Client
      </p>

      {/* Avatar + name + badge */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
          style={{ fontSize: "0.65rem" }}
        >
          {client.avatar ? (
            <img src={client.avatar} alt={client.fullName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-900 font-bold leading-tight" style={{ fontSize: "0.88rem" }}>
              {client.fullName}
            </p>
            {isVerified && (
              <span
                className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                style={{ fontSize: "0.7rem" }}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
          {client.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                {client.location}
              </span>
            </div>
          )}
          {(client.companyName || websiteUrl) && (
            <div className="flex items-center gap-2 mt-1">
              {client.companyName && (
                <div className="flex items-center gap-1 min-w-0">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-500 truncate" style={{ fontSize: "0.72rem" }}>
                    {client.companyName}
                  </span>
                </div>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  title="Open client website"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {client.bio && (
        <p className="text-slate-500 leading-relaxed" style={{ fontSize: "0.75rem" }}>
          {client.bio}
        </p>
      )}

      {/* Stats */}
      {hasStats && (
        <>
          <div className="h-px bg-slate-200" />
          <div className="flex flex-wrap gap-3">
            {jobsPosted != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {jobsPosted} Jobs Posted
                </span>
              </div>
            )}
            {projectsCompleted != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FolderCheck className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {projectsCompleted} Projects Completed
                </span>
              </div>
            )}
            {averageRating != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {averageRating} Rating
                </span>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-3 h-3 text-violet-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  Joined {joinedDate}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {showReportAction && (
        <>
          <div className="h-px bg-slate-200" />
          <ReportUserAction reportedUserName={client.fullName} reportedUserRole="client" />
        </>
      )}
    </div>
  );
}
