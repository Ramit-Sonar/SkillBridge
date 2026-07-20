import type { ProfileProject, ProfileReview, ProfileViewProps } from "./StudentProfileView";
import type {
  ProjectProfileCompletedProject,
  ProjectStudentProfile,
  ProjectSummary,
} from "../../../services/projectService";
import type { StudentSummary } from "../../../services/applicationService";
import type { StudentRatingSummary, StudentReviewSummary } from "../../../services/reviewService";

type UserProfileSource = {
  fullName?: string;
  avatar?: string;
};

type BasicProfileFields = {
  bio?: string;
  education?: string;
  university?: string;
  skills?: (string | { name: string; verified: boolean })[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
};

type BasicProfileSource = BasicProfileFields & {
  name?: string;
  fullName?: string;
  initials?: string;
  headline?: string;
  avatar?: string;
  avatarUrl?: string;
  verified?: boolean;
  statistics?: StudentRatingSummary & {
    completedProjectsCount?: number;
  };
  verification?: {
    status: string | null;
    verifiedAt: string | null;
  };
  completedProjects?: ProjectProfileCompletedProject[];
  latestReviews?: StudentReviewSummary[];
  profile?: BasicProfileFields;
};

type ProfileSource = BasicProfileSource | ProjectStudentProfile | StudentSummary | null | undefined;

type BuildStudentProfileViewPropsInput = {
  user?: UserProfileSource | null;
  profile?: ProfileSource;
  ratingSummary?: StudentRatingSummary | null;
  reviews?: StudentReviewSummary[] | null;
  completedProjects?: (ProjectProfileCompletedProject | ProjectSummary)[] | null;
  verified?: boolean;
  fallbackName?: string;
  fallbackBio?: string;
};

const emptyRatingDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

/**
 * Converts different student profile API shapes into one StudentProfileView contract.
 */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatProfileDate(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNestedProfile(profile: ProfileSource) {
  return profile && "profile" in profile ? profile.profile : profile;
}

function getName(profile: ProfileSource, user?: UserProfileSource | null, fallbackName = "") {
  if (profile && "name" in profile && profile.name) return profile.name;
  if (profile && "fullName" in profile && profile.fullName) return profile.fullName;
  if (user?.fullName) return user.fullName;

  return fallbackName;
}

function getAvatar(profile: ProfileSource, user?: UserProfileSource | null) {
  if (profile && "avatarUrl" in profile && profile.avatarUrl) return profile.avatarUrl;
  if (profile && "avatar" in profile && profile.avatar) return profile.avatar;

  return user?.avatar || "";
}

function getVerified(profile: ProfileSource, fallbackVerified?: boolean) {
  if (fallbackVerified !== undefined) return fallbackVerified;

  if (profile && "verified" in profile) return Boolean(profile.verified);
  if (profile && "verification" in profile) {
    // Backend verification status is preferred, with verifiedAt kept for older responses.
    return profile.verification?.status === "approved" || Boolean(profile.verification?.verifiedAt);
  }

  return false;
}

function getStatistics(profile: ProfileSource, ratingSummary?: StudentRatingSummary | null) {
  const profileStatistics = profile && "statistics" in profile ? profile.statistics : undefined;

  return {
    averageRating: ratingSummary?.averageRating ?? profileStatistics?.averageRating ?? 0,
    reviewCount: ratingSummary?.reviewCount ?? profileStatistics?.reviewCount ?? 0,
    ratingDistribution:
      ratingSummary?.ratingDistribution ??
      profileStatistics?.ratingDistribution ??
      emptyRatingDistribution,
    completedProjectsCount: profileStatistics?.completedProjectsCount,
  };
}

function mapSkills(skills?: (string | { name: string; verified: boolean })[]) {
  return (skills || []).map((skill) =>
    typeof skill === "string" ? { name: skill, verified: false } : skill
  );
}

function getReviewProjectId(review: StudentReviewSummary) {
  return review.project?._id?.toString() || "";
}

function mapReview(review: StudentReviewSummary): ProfileReview {
  const clientName = review.client?.fullName || "Client";

  return {
    id: review.reviewId,
    clientName,
    clientInitials: getInitials(clientName) || "CL",
    clientAvatar: review.client?.avatar || undefined,
    rating: review.rating,
    comment: review.comment,
    submittedAt: formatProfileDate(review.createdAt),
  };
}

function isDetailedProject(
  project: ProjectProfileCompletedProject | ProjectSummary
): project is ProjectProfileCompletedProject {
  return "projectId" in project;
}

function mapProject(
  project: ProjectProfileCompletedProject | ProjectSummary,
  reviews: StudentReviewSummary[]
): ProfileProject {
  const projectId = isDetailedProject(project) ? project.projectId : project.id;
  const matchingReview = reviews.find((review) => getReviewProjectId(review) === projectId);

  if (isDetailedProject(project)) {
    return {
      id: project.projectId,
      title: project.job?.title || "Completed Project",
      category: project.job?.category || "",
      description: project.job?.description || undefined,
      skills: project.job?.skills || [],
      rating: matchingReview?.rating,
      clientName: project.client?.fullName,
      completedAt: formatProfileDate(project.completedAt),
      repositoryLink: project.latestSubmission?.repositoryLink || undefined,
      liveUrl: project.latestSubmission?.liveUrl || project.latestSubmission?.demoLink || undefined,
      reviewComment: matchingReview?.comment || undefined,
    };
  }

  const latestSubmission = project.submissions[0];

  return {
    id: project.id,
    title: project.title,
    category: project.category,
    description: project.description || undefined,
    skills: project.skills || [],
    rating: matchingReview?.rating,
    clientName: project.client?.name,
    completedAt: formatProfileDate(project.completedAt),
    repositoryLink: latestSubmission?.repositoryLink || undefined,
    liveUrl: latestSubmission?.liveUrl || latestSubmission?.demoLink || undefined,
    reviewComment: matchingReview?.comment || undefined,
  };
}

export function buildStudentProfileViewProps({
  user,
  profile,
  ratingSummary,
  reviews,
  completedProjects,
  verified,
  fallbackName = "",
  fallbackBio = "",
}: BuildStudentProfileViewPropsInput): ProfileViewProps {
  const nestedProfile = getNestedProfile(profile);
  const profileReviews =
    reviews || (profile && "latestReviews" in profile ? profile.latestReviews : []) || [];
  const profileProjects =
    completedProjects ||
    (profile && "completedProjects" in profile ? profile.completedProjects : []) ||
    [];
  const statistics = getStatistics(profile, ratingSummary);
  const name = getName(profile, user, fallbackName);
  const education = nestedProfile?.education || "";
  const university = nestedProfile?.university || "";

  // The profile page accepts data from settings, applications, projects, and public profile APIs.
  return {
    name,
    initials:
      profile && "initials" in profile && profile.initials ? profile.initials : getInitials(name),
    headline:
      profile && "headline" in profile && profile.headline
        ? profile.headline
        : education || university,
    education,
    university,
    bio: nestedProfile?.bio || fallbackBio,
    verified: getVerified(profile, verified),
    skills: mapSkills(nestedProfile?.skills),
    rating: statistics.averageRating,
    reviewCount: statistics.reviewCount,
    ratingDistribution: statistics.ratingDistribution,
    completedProjectsCount: statistics.completedProjectsCount ?? profileProjects.length,
    github: nestedProfile?.github || undefined,
    linkedin: nestedProfile?.linkedin || undefined,
    portfolio: nestedProfile?.portfolio || undefined,
    projects: profileProjects.map((project) => mapProject(project, profileReviews)),
    reviews: profileReviews.map(mapReview),
    avatarUrl: getAvatar(profile, user) || undefined,
  };
}
