import { CheckCircle, MapPin, Briefcase, FolderCheck, CalendarDays, Star } from "lucide-react";

export interface ClientCardData {
  name: string;
  initials?: string;
  location?: string;
  about?: string;
  avatar?: string;
  verified?: boolean;
  jobsPosted?: number;
  projectsCompleted?: number;
  joinedDate?: string;
  rating?: number;
}

export function ClientInformationCard({ client }: { client: ClientCardData }) {
  const initials = client.initials ?? client.name.slice(0, 2).toUpperCase();
  const hasStats =
    client.jobsPosted != null ||
    client.projectsCompleted != null ||
    client.joinedDate ||
    client.rating != null;

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
            <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-slate-900 font-bold leading-tight" style={{ fontSize: "0.88rem" }}>
            {client.name}
          </p>
          {client.verified && (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600 font-semibold" style={{ fontSize: "0.62rem" }}>
                Verified Client
              </span>
            </div>
          )}
          {client.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                {client.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {client.about && (
        <p className="text-slate-500 leading-relaxed" style={{ fontSize: "0.75rem" }}>
          {client.about}
        </p>
      )}

      {/* Stats */}
      {hasStats && (
        <>
          <div className="h-px bg-slate-200" />
          <div className="flex flex-wrap gap-3">
            {client.jobsPosted != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {client.jobsPosted} Jobs Posted
                </span>
              </div>
            )}
            {client.projectsCompleted != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FolderCheck className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {client.projectsCompleted} Projects Completed
                </span>
              </div>
            )}
            {client.rating != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  {client.rating} Rating
                </span>
              </div>
            )}
            {client.joinedDate && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-3 h-3 text-violet-600" />
                </div>
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.72rem" }}>
                  Joined {client.joinedDate}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
