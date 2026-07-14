import { useState, type ElementType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, Briefcase, CheckCircle, Github, Globe, Linkedin, Star } from "lucide-react";

export interface ProfileProject {
  id: string;
  title: string;
  category: string;
  description?: string;
  skills: string[];
  rating?: number;
  clientName?: string;
  completedAt?: string;
  repositoryLink?: string;
  liveUrl?: string;
  reviewComment?: string;
}

export interface ProfileReview {
  id: string;
  clientName: string;
  clientInitials: string;
  clientAvatar?: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

export type ProfileRatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export interface ProfileCertificate {
  id: string;
  title: string;
  issuer?: string;
  issuedAt?: string;
  url?: string;
}

export interface ProfileViewProps {
  name: string;
  initials: string;
  headline: string;
  location?: string;
  education?: string;
  university?: string;
  bio: string;
  verified: boolean;
  skills: { name: string; verified: boolean }[];
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: ProfileRatingDistribution;
  completedProjectsCount?: number;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  projects?: ProfileProject[];
  certificates?: ProfileCertificate[];
  reviews?: ProfileReview[];
  /** User.avatar from MongoDB */
  avatarUrl?: string;
}

function SocialIcon({
  icon: Icon,
  label,
  href,
}: {
  icon: ElementType;
  label: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);
  const linkHref =
    href.toLowerCase().startsWith("http://") || href.toLowerCase().startsWith("https://")
      ? href
      : `https://${href}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
      >
        <Icon className="w-3.5 h-3.5" />
      </a>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-20"
          >
            <div
              className="bg-slate-900 text-white font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap relative"
              style={{ fontSize: "0.65rem" }}
            >
              {label}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid #0F172A",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileOverview({ profile }: { profile: ProfileViewProps }) {
  const avatar = profile.avatarUrl;
  const verifiedSkillsCount = profile.skills.filter((skill) => skill.verified).length;
  const hasRating = profile.rating !== undefined && profile.reviewCount !== undefined;
  const hasCompletedProjects = profile.completedProjectsCount !== undefined;

  const socialLinks = [
    profile.github && { icon: Github, label: "GitHub", href: profile.github },
    profile.linkedin && { icon: Linkedin, label: "LinkedIn", href: profile.linkedin },
    profile.portfolio && { icon: Globe, label: "Portfolio", href: profile.portfolio },
  ].filter(Boolean) as { icon: ElementType; label: string; href: string }[];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
        >
          {avatar ? (
            <img src={avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold"
              style={{ fontSize: "0.9rem" }}
            >
              {profile.initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className="text-slate-900"
              style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              {profile.name}
            </h2>
            {profile.verified && (
              <span
                className="inline-flex items-center gap-1 text-blue-600 font-semibold"
                style={{ fontSize: "0.7rem" }}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
          {profile.education && (
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {profile.education}
            </p>
          )}
          {profile.university && (
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {profile.university}
            </p>
          )}
          {profile.location && (
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {profile.location}
            </p>
          )}
          {!profile.education && !profile.university && !profile.location && profile.headline && (
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              {profile.headline}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {hasRating && (
              <>
                <Star className="w-3.5 h-3.5" fill="#F59E0B" color="#F59E0B" />
                <span className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                  {profile.rating?.toFixed(1)}
                </span>
                <span className="text-slate-400" style={{ fontSize: "0.72rem" }}>
                  ({profile.reviewCount} Reviews)
                </span>
              </>
            )}
            {hasCompletedProjects && (
              <>
                {hasRating && (
                  <span className="text-slate-300" style={{ fontSize: "0.72rem" }}>
                    {"\u00b7"}
                  </span>
                )}
                <span className="text-slate-400" style={{ fontSize: "0.72rem" }}>
                  <strong className="text-slate-500 font-semibold">
                    {profile.completedProjectsCount}
                  </strong>{" "}
                  Completed Projects
                </span>
              </>
            )}
            {(hasRating || hasCompletedProjects) && (
              <span className="text-slate-300" style={{ fontSize: "0.72rem" }}>
                {"\u00b7"}
              </span>
            )}
            <span className="text-slate-400" style={{ fontSize: "0.72rem" }}>
              <strong className="text-slate-500 font-semibold">{verifiedSkillsCount}</strong>{" "}
              Verified Skill{verifiedSkillsCount !== 1 ? "s" : ""}
            </span>
          </div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {socialLinks.map((link) => (
                <SocialIcon key={link.label} {...link} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function About({ bio }: { bio: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
      <p className="text-slate-900 font-bold mb-2" style={{ fontSize: "0.85rem" }}>
        About
      </p>
      <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.82rem" }}>
        {bio || "No bio has been added yet."}
      </p>
    </div>
  );
}

function Skills({ skills }: { skills: { name: string; verified: boolean }[] }) {
  const verified = skills.filter((skill) => skill.verified);
  const regular = skills.filter((skill) => !skill.verified);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col gap-3">
      <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
        Skills
      </p>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {verified.map((skill) => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-600 font-semibold px-2.5 py-1.5 rounded-xl"
              style={{ fontSize: "0.72rem" }}
            >
              <CheckCircle className="w-3 h-3 shrink-0" />
              {skill.name}
              <span style={{ fontSize: "0.58rem", color: "#6EE7B7", fontWeight: 600 }}>
                Verified
              </span>
            </span>
          ))}
          {regular.map((skill) => (
            <span
              key={skill.name}
              className="bg-slate-50 border border-slate-200 text-slate-600 font-medium px-2.5 py-1.5 rounded-xl"
              style={{ fontSize: "0.72rem" }}
            >
              {skill.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
          No skills have been added yet.
        </p>
      )}
      <p className="text-slate-300" style={{ fontSize: "0.65rem" }}>
        Verified skills are earned through completed projects and positive client ratings.
      </p>
    </div>
  );
}

function getExternalHref(url: string) {
  return url.toLowerCase().startsWith("http://") || url.toLowerCase().startsWith("https://")
    ? url
    : `https://${url}`;
}

function Portfolio({ projects }: { projects: ProfileProject[] }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
            Portfolio & Experience
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Completed projects and practical experience
          </p>
        </div>
        <span
          className="bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full"
          style={{ fontSize: "0.62rem" }}
        >
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
            No completed projects yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
              className="border border-black/[0.06] hover:border-blue-200 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p
                  className="text-slate-900 font-semibold leading-tight"
                  style={{ fontSize: "0.82rem" }}
                >
                  {project.title}
                </p>
                <span
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ fontSize: "0.55rem" }}
                >
                  <CheckCircle className="w-2.5 h-2.5" /> Completed
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {project.rating !== undefined && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" fill="#F59E0B" color="#F59E0B" />
                      <span
                        className="text-amber-600 font-semibold"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {project.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-slate-200" style={{ fontSize: "0.65rem" }}>
                      {"\u00b7"}
                    </span>
                  </>
                )}
                <span className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                  {project.category}
                </span>
                {(project.clientName || project.completedAt) && (
                  <>
                    <span className="text-slate-200" style={{ fontSize: "0.65rem" }}>
                      {"\u00b7"}
                    </span>
                    <span className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                      {[project.clientName, project.completedAt].filter(Boolean).join(" - ")}
                    </span>
                  </>
                )}
              </div>
              {project.description && (
                <p
                  className="text-slate-500 leading-snug line-clamp-2"
                  style={{ fontSize: "0.75rem" }}
                >
                  {project.description}
                </p>
              )}
              <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                {project.skills.join(" - ")}
              </p>
              {(project.repositoryLink || project.liveUrl) && (
                <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: "0.68rem" }}>
                  {project.repositoryLink && (
                    <a
                      href={getExternalHref(project.repositoryLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      Repository
                    </a>
                  )}
                  {project.repositoryLink && project.liveUrl && (
                    <span className="text-slate-200">{"\u00b7"}</span>
                  )}
                  {project.liveUrl && (
                    <a
                      href={getExternalHref(project.liveUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Certificates({ certificates }: { certificates: ProfileCertificate[] }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
            Certificates
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Credentials and learning achievements
          </p>
        </div>
        <span
          className="bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full"
          style={{ fontSize: "0.62rem" }}
        >
          {certificates.length} certificate{certificates.length !== 1 ? "s" : ""}
        </span>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
            No certificates added yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {certificates.map((certificate) => {
            const content = (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 transition-all duration-200">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
                    {certificate.title}
                  </p>
                  {(certificate.issuer || certificate.issuedAt) && (
                    <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.7rem" }}>
                      {[certificate.issuer, certificate.issuedAt].filter(Boolean).join(" - ")}
                    </p>
                  )}
                </div>
              </div>
            );

            return certificate.url ? (
              <a
                key={certificate.id}
                href={certificate.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:-translate-y-0.5 transition-transform"
              >
                {content}
              </a>
            ) : (
              <div key={certificate.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Reviews({
  reviews,
  rating = 0,
  reviewCount = 0,
}: {
  reviews: ProfileReview[];
  rating?: number;
  reviewCount?: number;
}) {
  const avg = rating.toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.85rem" }}>
            Reviews & Ratings
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            Feedback from previous clients
          </p>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" fill="#F59E0B" color="#F59E0B" />
            <span
              className="text-amber-600 font-bold"
              style={{ fontSize: "0.95rem", lineHeight: 1 }}
            >
              {avg}
            </span>
          </div>
          <div className="border-l border-amber-200 pl-3">
            <p className="text-amber-600 font-semibold" style={{ fontSize: "0.72rem" }}>
              {reviewCount} Reviews
            </p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
              No reviews yet
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Complete projects to build your reputation.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
              className="bg-slate-50 border border-slate-200 hover:border-blue-200 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
                    style={{ fontSize: "0.48rem" }}
                  >
                    {review.clientAvatar ? (
                      <img
                        src={review.clientAvatar}
                        alt={review.clientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      review.clientInitials
                    )}
                  </div>
                  <p className="text-slate-900 font-semibold" style={{ fontSize: "0.8rem" }}>
                    {review.clientName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Star className="w-3 h-3" fill="#F59E0B" color="#F59E0B" />
                  <span className="text-amber-600 font-semibold" style={{ fontSize: "0.72rem" }}>
                    {review.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-300" style={{ fontSize: "0.62rem" }}>
                    {"\u00b7"} {review.submittedAt}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.78rem" }}>
                "{review.comment}"
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentProfileView({
  profile,
}: {
  profile: ProfileViewProps;
  showReport?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileOverview profile={profile} />
      <About bio={profile.bio} />
      <Skills skills={profile.skills} />
      <Portfolio projects={profile.projects ?? []} />
      <Certificates certificates={profile.certificates ?? []} />
      <Reviews
        reviews={profile.reviews ?? []}
        rating={profile.rating}
        reviewCount={profile.reviewCount}
      />
    </div>
  );
}
