export const buildApplicationSummary = (application) => ({
  applicationId: application._id,
  status: application.status,
  appliedAt: application.appliedAt,
  job: application.job
    ? {
        jobId: application.job._id,
        title: application.job.title,
        budget: application.job.budget,
        jobType: application.job.category,
        status: application.job.status,
        clientName: application.job.client?.fullName || "",
      }
    : null,
});

export const buildApplicationDetails = ({
  application,
  studentProfile,
  studentVerification,
  clientSummary,
}) => ({
  applicationId: application._id,
  status: application.status,
  appliedAt: application.appliedAt,
  acceptedAt: application.acceptedAt,
  rejectedAt: application.rejectedAt,
  withdrawnAt: application.withdrawnAt,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  coverMessage: application.coverMessage,
  estimatedCompletionTime: application.estimatedCompletionTime,
  whySuitable: application.whySuitable,
  attachments: application.attachments,
  job: application.job
    ? {
        jobId: application.job._id,
        title: application.job.title,
        category: application.job.category,
        description: application.job.description,
        requirements: application.job.requirements,
        skills: application.job.skills,
        budget: application.job.budget,
        duration: application.job.duration,
        deadline: application.job.deadline,
        complexity: application.job.complexity,
        attachments: application.job.attachments,
        status: application.job.status,
        createdAt: application.job.createdAt,
        client: clientSummary,
      }
    : null,
  student: application.student
    ? {
        studentId: application.student._id,
        fullName: application.student.fullName,
        avatar: application.student.avatar,
        profileCompleted: application.student.profileCompleted,
        verification: {
          status: studentVerification?.status || null,
          verifiedAt: studentVerification?.verifiedAt || null,
        },
        profile: {
          bio: studentProfile?.bio || "",
          education: studentProfile?.education || "",
          university: studentProfile?.university || "",
          skills: studentProfile?.skills || [],
          github: studentProfile?.github || "",
          linkedin: studentProfile?.linkedin || "",
          portfolio: studentProfile?.portfolio || "",
        },
      }
    : null,
});
