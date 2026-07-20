/**
 * Shapes application records for list cards and detail views.
 */
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

export const buildStudentSummary = ({
  student,
  studentProfile,
  studentVerification,
  studentProjectProfile,
  studentReviewProfile,
}) => ({
  studentId: student._id,
  fullName: student.fullName,
  avatar: student.avatar,
  profileCompleted: student.profileCompleted,
  statistics: {
    averageRating: studentReviewProfile?.ratingSummary?.averageRating || 0,
    reviewCount: studentReviewProfile?.ratingSummary?.reviewCount || 0,
    ratingDistribution: studentReviewProfile?.ratingSummary
      ?.ratingDistribution || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    completedProjectsCount: studentProjectProfile?.completedProjectsCount || 0,
  },
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
  completedProjects: studentProjectProfile?.completedProjects || [],
  latestReviews: studentReviewProfile?.latestReviews || [],
});

export const buildApplicantSummary = ({
  application,
  studentProfile,
  studentVerification,
  studentProjectProfile,
  studentReviewProfile,
}) => ({
  applicationId: application._id,
  status: application.status,
  appliedAt: application.appliedAt,
  student: application.student
    ? buildStudentSummary({
        student: application.student,
        studentProfile,
        studentVerification,
        studentProjectProfile,
        studentReviewProfile,
      })
    : null,
});

export const buildApplicationDetails = ({
  application,
  studentProfile,
  studentVerification,
  clientSummary,
  studentProjectProfile,
  studentReviewProfile,
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
        ...buildStudentSummary({
          student: application.student,
          studentProfile,
          studentVerification,
          studentProjectProfile,
          studentReviewProfile,
        }),
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
