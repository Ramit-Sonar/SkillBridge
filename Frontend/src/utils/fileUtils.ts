import { type ElementType } from "react";
import {
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
} from "lucide-react";

export type FileAttachment = {
  url?: string;
  publicId?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
};

const PREVIEW_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
];

export function isValidAttachmentUrl(url?: string) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

export function isPreviewSupported(mimeType?: string) {
  return PREVIEW_MIME_TYPES.includes(mimeType?.toLowerCase() ?? "");
}

export function formatFileSize(size?: number) {
  if (!size || size <= 0) return "Size unavailable";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function truncateFileName(fileName?: string, maxLength = 42) {
  if (!fileName) return "Unnamed attachment";
  if (fileName.length <= maxLength) return fileName;

  const lastDotIndex = fileName.lastIndexOf(".");
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : "";
  const nameOnly = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const availableLength = Math.max(maxLength - extension.length - 3, 8);

  return `${nameOnly.slice(0, availableLength)}...${extension}`;
}

export function getFileIcon(mimeType?: string): {
  label: string;
  icon: ElementType;
  bg: string;
  color: string;
} {
  const type = mimeType?.toLowerCase() ?? "";

  if (type.includes("pdf")) {
    return { label: "PDF", icon: FileText, bg: "#FEF2F2", color: "#DC2626" };
  }

  if (type.startsWith("image/")) {
    return { label: "Image", icon: ImageIcon, bg: "#F0FDFA", color: "#0D9488" };
  }

  if (type.includes("wordprocessingml") || type.includes("msword")) {
    return { label: "Word", icon: FileText, bg: "#EFF6FF", color: "#2563EB" };
  }

  if (type.includes("spreadsheetml") || type.includes("ms-excel")) {
    return { label: "Excel", icon: FileSpreadsheet, bg: "#ECFDF5", color: "#059669" };
  }

  if (type.includes("presentationml") || type.includes("ms-powerpoint")) {
    return { label: "PowerPoint", icon: Presentation, bg: "#FFFBEB", color: "#D97706" };
  }

  if (type.includes("zip") || type.includes("rar")) {
    return { label: "Archive", icon: FileArchive, bg: "#FFFBEB", color: "#D97706" };
  }

  if (type.startsWith("text/")) {
    return { label: "Text", icon: FileText, bg: "#F8FAFC", color: "#64748B" };
  }

  return { label: "File", icon: File, bg: "#F8FAFC", color: "#64748B" };
}

export async function downloadAttachment(attachment: FileAttachment) {
  const attachmentUrl = attachment.url;

  if (!attachmentUrl || !isValidAttachmentUrl(attachmentUrl)) {
    throw new Error("Attachment link is unavailable.");
  }

  const response = await fetch(attachmentUrl);

  if (!response.ok) {
    throw new Error("Attachment could not be downloaded.");
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const fileName = attachment.originalName?.replace(/[\\/:*?"<>|]/g, "_").trim() || "attachment";
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
}
