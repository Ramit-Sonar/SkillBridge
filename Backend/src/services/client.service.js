import { ClientProfile } from "../models/clientProfile.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";

const buildClientSummary = async (userId) => {
  if (!userId) return null;

  const [client, clientProfile, jobsPosted] = await Promise.all([
    User.findById(userId).select("fullName avatar createdAt"),
    ClientProfile.findOne({ user: userId }).select(
      "location bio companyName website"
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
    verification: {
      status: null,
      verifiedAt: null,
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
