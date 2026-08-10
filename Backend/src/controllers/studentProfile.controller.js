import mongoose from "mongoose";
import { StudentProfile } from "../models/studentProfile.model.js";
import { User } from "../models/user.model.js";
import { Verification } from "../models/verification.model.js";
import { buildStudentSummary } from "../services/application.service.js";
import { getStudentCompletedProjectProfileMap } from "../services/project.service.js";
import { getStudentReviewProfileMap } from "../services/review.service.js";
import { deleteAttachments, uploadAttachments } from "../utils/attachment.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeTempFiles } from "../utils/tempFile.js";

/*
 * Handles private profile updates and public student profile aggregation.
 */
const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Student profile is empty."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Student profile fetched successfully")
    );
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  const { bio, education, university, skills, github, linkedin, portfolio } =
    req.body || {};

  const updateData = {};

  if (bio !== undefined) updateData.bio = bio;
  if (education !== undefined) updateData.education = education;
  if (university !== undefined) updateData.university = university;
  if (skills !== undefined) updateData.skills = skills;
  if (github !== undefined) updateData.github = github;
  if (linkedin !== undefined) updateData.linkedin = linkedin;
  if (portfolio !== undefined) updateData.portfolio = portfolio;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No profile fields provided");
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: updateData,
      $setOnInsert: { user: req.user._id },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully."));
});

const normalizeDate = (value, fieldName, required = false) => {
  if (!value) {
    if (required) throw new ApiError(400, `${fieldName} is required`);
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return parsedDate;
};

const normalizeOptionalUrl = (value) => {
  const url = typeof value === "string" ? value.trim() : "";

  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return url;
    }
  } catch {
    // The same validation message is used for malformed URLs and unsupported protocols.
  }

  throw new ApiError(400, "Credential URL must start with http:// or https://");
};

const getCertificatePayload = (body = {}, { requireFile = false, file } = {}) => {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const issuingOrganization =
    typeof body.issuingOrganization === "string"
      ? body.issuingOrganization.trim()
      : "";
  const issueDate = normalizeDate(body.issueDate, "Issue date", true);
  const expiryDate = normalizeDate(body.expiryDate, "Expiry date");
  const credentialId =
    typeof body.credentialId === "string" ? body.credentialId.trim() : "";
  const credentialUrl = normalizeOptionalUrl(body.credentialUrl);

  if (!title) throw new ApiError(400, "Certificate title is required");
  if (!issuingOrganization) {
    throw new ApiError(400, "Issuing organization is required");
  }
  if (title.length > 120) {
    throw new ApiError(400, "Certificate title must be 120 characters or less");
  }
  if (issuingOrganization.length > 120) {
    throw new ApiError(
      400,
      "Issuing organization must be 120 characters or less"
    );
  }
  if (credentialId.length > 120) {
    throw new ApiError(400, "Credential ID must be 120 characters or less");
  }
  if (credentialUrl.length > 300) {
    throw new ApiError(400, "Credential URL must be 300 characters or less");
  }
  if (expiryDate && expiryDate < issueDate) {
    throw new ApiError(400, "Expiry date cannot be before issue date");
  }
  if (requireFile && !file) {
    throw new ApiError(400, "Certificate file is required");
  }

  return {
    title,
    issuingOrganization,
    issueDate,
    expiryDate,
    credentialId,
    credentialUrl,
  };
};

const getOrCreateStudentProfile = async (userId) => {
  return StudentProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { returnDocument: "after", upsert: true, runValidators: true }
  );
};

const hasDuplicateCertificate = (certificates, payload, ignoredId = "") => {
  const title = payload.title.toLowerCase();
  const issuer = payload.issuingOrganization.toLowerCase();

  return certificates.some((certificate) => {
    if (ignoredId && certificate._id.toString() === ignoredId) return false;

    return (
      certificate.title.toLowerCase() === title &&
      certificate.issuingOrganization.toLowerCase() === issuer
    );
  });
};

const mapCertificate = (certificate) => ({
  id: certificate._id?.toString(),
  title: certificate.title,
  issuingOrganization: certificate.issuingOrganization,
  issueDate: certificate.issueDate,
  expiryDate: certificate.expiryDate || null,
  credentialId: certificate.credentialId || "",
  credentialUrl: certificate.credentialUrl || "",
  file: certificate.file,
});

const getStudentCertificates = asyncHandler(async (req, res) => {
  const profile = await getOrCreateStudentProfile(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        certificates: profile.certificates.map(mapCertificate),
      },
      "Certificates fetched successfully"
    )
  );
});

const addStudentCertificate = asyncHandler(async (req, res) => {
  const uploadedFile = req.file;
  let uploadedAttachments = [];

  try {
    const payload = getCertificatePayload(req.body, {
      requireFile: true,
      file: uploadedFile,
    });
    const profile = await getOrCreateStudentProfile(req.user._id);

    if (hasDuplicateCertificate(profile.certificates, payload)) {
      throw new ApiError(
        409,
        "This certificate has already been added to your profile"
      );
    }

    uploadedAttachments = await uploadAttachments([uploadedFile]);

    const certificate = {
      ...payload,
      file: uploadedAttachments[0],
    };

    profile.certificates.push(certificate);
    await profile.save();

    const savedCertificate =
      profile.certificates[profile.certificates.length - 1];

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          mapCertificate(savedCertificate),
          "Certificate uploaded successfully"
        )
      );
  } catch (error) {
    await deleteAttachments(uploadedAttachments);
    throw error;
  } finally {
    removeTempFiles(uploadedFile ? [uploadedFile] : []);
  }
});

const updateStudentCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const uploadedFile = req.file;
  let uploadedAttachments = [];

  if (!mongoose.isValidObjectId(certificateId)) {
    throw new ApiError(400, "Invalid certificate id");
  }

  try {
    const payload = getCertificatePayload(req.body, { file: uploadedFile });
    const profile = await getOrCreateStudentProfile(req.user._id);
    const certificate = profile.certificates.id(certificateId);

    if (!certificate) {
      throw new ApiError(404, "Certificate not found");
    }

    if (hasDuplicateCertificate(profile.certificates, payload, certificateId)) {
      throw new ApiError(
        409,
        "This certificate has already been added to your profile"
      );
    }

    let oldFile = null;

    if (uploadedFile) {
      uploadedAttachments = await uploadAttachments([uploadedFile]);
      oldFile = certificate.file;
      certificate.file = uploadedAttachments[0];
    }

    certificate.title = payload.title;
    certificate.issuingOrganization = payload.issuingOrganization;
    certificate.issueDate = payload.issueDate;
    certificate.expiryDate = payload.expiryDate;
    certificate.credentialId = payload.credentialId;
    certificate.credentialUrl = payload.credentialUrl;

    await profile.save();

    if (oldFile) {
      await deleteAttachments([oldFile]);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mapCertificate(certificate),
          "Certificate updated successfully"
        )
      );
  } catch (error) {
    await deleteAttachments(uploadedAttachments);
    throw error;
  } finally {
    removeTempFiles(uploadedFile ? [uploadedFile] : []);
  }
});

const deleteStudentCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  if (!mongoose.isValidObjectId(certificateId)) {
    throw new ApiError(400, "Invalid certificate id");
  }

  const profile = await getOrCreateStudentProfile(req.user._id);
  const certificate = profile.certificates.id(certificateId);

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  const fileToDelete = certificate.file;
  certificate.deleteOne();
  await profile.save();
  await deleteAttachments([fileToDelete]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { certificateId }, "Certificate deleted successfully")
    );
});

const getPublicStudentProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, "Invalid student id");
  }

  const student = await User.findOne({ _id: studentId, role: "student" })
    .select("_id fullName avatar profileCompleted")
    .lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const [
    studentProfile,
    studentVerification,
    studentProjectProfileMap,
    studentReviewProfileMap,
  ] = await Promise.all([
    StudentProfile.findOne({ user: studentId })
      .select(
        "bio education university skills verifiedSkills github linkedin portfolio certificates"
      )
      .lean(),
    Verification.findOne({ user: studentId, type: "student" })
      .select("status verifiedAt")
      .lean(),
    getStudentCompletedProjectProfileMap([studentId]),
    getStudentReviewProfileMap([studentId]),
  ]);

  // Public profiles combine editable profile fields with computed trust metrics.
  const publicProfile = buildStudentSummary({
    student,
    studentProfile,
    studentVerification,
    studentProjectProfile: studentProjectProfileMap.get(studentId),
    studentReviewProfile: studentReviewProfileMap.get(studentId),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        publicProfile,
        "Public student profile fetched successfully"
      )
    );
});

export {
  addStudentCertificate,
  deleteStudentCertificate,
  getPublicStudentProfile,
  getStudentCertificates,
  getStudentProfile,
  updateStudentCertificate,
  updateStudentProfile,
};
