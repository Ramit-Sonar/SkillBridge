import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Upload, X } from "lucide-react";
import { formatFileSize, getFileIcon, truncateFileName } from "../../../utils/fileUtils";

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

const DEFAULT_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.svg,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.fig,.psd,.ai,.apk,.exe";

type FileUploadAreaProps = {
  files: UploadedFile[];
  onAdd: (file: UploadedFile) => void;
  onRemove: (name: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
};

export function FileUploadArea({
  files,
  onAdd,
  onRemove,
  disabled = false,
  maxFiles = 3,
  accept = DEFAULT_ACCEPT,
}: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleRaw = useCallback(
    (raw: File) => {
      if (disabled || files.length >= maxFiles || files.find((file) => file.name === raw.name)) {
        return;
      }

      onAdd({
        file: raw,
        name: raw.name,
        size: raw.size,
        type: raw.type || "application/octet-stream",
      });
    },
    [disabled, files, maxFiles, onAdd]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    Array.from(e.dataTransfer.files).forEach(handleRaw);
  };

  return (
    <div className="flex flex-col gap-3">
      {files.length < maxFiles && (
        <motion.div
          animate={dragging ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          onDragOver={(e) => {
            e.preventDefault();
            if (disabled) return;
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (disabled) return;
            inputRef.current?.click();
          }}
          className={`flex flex-col items-center gap-3 rounded-2xl py-8 px-6 transition-all duration-200 ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
          style={{
            border: `2px dashed ${dragging ? "#2563EB" : "#E2E8F0"}`,
            background: dragging ? "#EFF6FF" : "#F8FAFC",
          }}
        >
          <motion.div
            animate={dragging ? { y: -3 } : { y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: dragging ? "#BFDBFE" : "#E2E8F0" }}
          >
            <Upload className="w-4 h-4" style={{ color: dragging ? "#2563EB" : "#94A3B8" }} />
          </motion.div>
          <div className="text-center">
            <p className="text-slate-900 font-semibold" style={{ fontSize: "0.85rem" }}>
              Drag and drop files here
            </p>
            <button
              type="button"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors mt-0.5"
              style={{ fontSize: "0.78rem" }}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                inputRef.current?.click();
              }}
              disabled={disabled}
            >
              Browse Files
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["PDF", "DOCX", "PNG", "JPG", "ZIP"].map((ext) => (
              <span
                key={ext}
                className="bg-white border border-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded-md"
                style={{ fontSize: "0.6rem" }}
              >
                {ext}
              </span>
            ))}
            <span className="text-slate-300" style={{ fontSize: "0.6rem" }}>
              Max {maxFiles} files
            </span>
          </div>
        </motion.div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach(handleRaw);
          e.target.value = "";
        }}
      />
      <AnimatePresence>
        {files.map((file) => {
          const fileDisplay = getFileIcon(file.type);
          const Icon = fileDisplay.icon;

          return (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: fileDisplay.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: fileDisplay.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-slate-900 font-medium truncate"
                  style={{ fontSize: "0.78rem" }}
                  title={file.name}
                >
                  {truncateFileName(file.name)}
                </p>
                <p className="text-slate-400" style={{ fontSize: "0.65rem" }}>
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(file.name)}
                disabled={disabled}
                className="text-slate-400 hover:text-red-400 hover:bg-red-50 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-400"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
