import { ClientProfile } from "../models/clientProfile.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";

/*
 * Builds the public client summary shown in job detail cards.
 */
const buildClientSummary = async (userId) => {
  if (!userId) return null;

  const [client, clientProfile, verification, jobsPosted] = await Promise.all([
    User.findById(userId).select("fullName avatar createdAt"),
    ClientProfile.findOne({ user: userId }).select(
      "location bio companyName website"
    ),
    Verification.findOne({ user: userId, type: "client" }).select(
      "status verifiedAt"
    ),
    Job.countDocuments({ client: userId }),
  ]);

  if (!client) return null;

  return {
    id: client._id.toString(),
    fullName: client.fullName,
    avatar: client.avatar,
    joined: client.createdAt,
    location: clientProfile?.location || "",
    companyName: clientProfile?.companyName || "",
    website: clientProfile?.website || "",
    bio: clientProfile?.bio || "",
    // Job detail badges rely on the verification record, not a cached user flag.
    verification: {
      status: verification?.status || null,
      verifiedAt: verification?.verifiedAt || null,
    },
    statistics: {
      jobsPosted,
      projectsCompleted: null,
      activeProjects: null,
      totalReviews: null,
      averageRating: null,
    },
  };
};

export { buildClientSummary };
