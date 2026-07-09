import { useState } from "react";
import { AlertCircle, Download, Eye, FileText } from "lucide-react";
import {
  downloadAttachment,
  formatFileSize,
  getFileIcon,
  isPreviewSupported,
  isValidAttachmentUrl,
  truncateFileName,
  type FileAttachment,
} from "../../../utils/fileUtils";

type Props = {
  attachment?: FileAttachment | null;
  canPreview?: boolean;
  canDownload?: boolean;
};

export function FileAttachmentCard({ attachment, canPreview = true, canDownload = true }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!attachment) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-5">
        <FileText className="w-5 h-5 text-slate-300" />
        <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
          No attachment available.
        </p>
      </div>
    );
  }

  const fileDisplay = getFileIcon(attachment.mimeType);
  const Icon = fileDisplay.icon;
  const hasValidUrl = isValidAttachmentUrl(attachment.url);
  const showPreview = canPreview && hasValidUrl && isPreviewSupported(attachment.mimeType);
  const showDownload = canDownload;

  const handlePreview = () => {
    if (!attachment.url) return;
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadError("");

    try {
      await downloadAttachment(attachment);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Attachment could not be downloaded."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: fileDisplay.bg }}
      >
        <Icon className="w-4 h-4" style={{ color: fileDisplay.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-slate-900 font-semibold truncate"
          style={{ fontSize: "0.75rem" }}
          title={attachment.originalName || "Unnamed attachment"}
        >
          {truncateFileName(attachment.originalName)}
        </p>
        <p className="text-slate-400" style={{ fontSize: "0.62rem" }}>
          {fileDisplay.label} file - {formatFileSize(attachment.size)}
        </p>
        {(!hasValidUrl || downloadError) && (
          <p
            className="inline-flex items-center gap-1 text-red-400 mt-1"
            style={{ fontSize: "0.62rem" }}
          >
            <AlertCircle className="w-3 h-3" />
            {downloadError || "Attachment link is unavailable."}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showPreview && (
          <button
            type="button"
            onClick={handlePreview}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Preview attachment"
            aria-label={`Preview ${attachment.originalName || "attachment"}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        {showDownload && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasValidUrl || isDownloading}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            title="Download attachment"
            aria-label={`Download ${attachment.originalName || "attachment"}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export type { FileAttachment };
