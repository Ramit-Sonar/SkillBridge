import { useState } from "react";
import { motion } from "motion/react";
import { Link, Upload } from "lucide-react";
import { FileUploadArea, type UploadedFile } from "./FileUploadArea";

export type ProjectSubmissionFormData = {
  notes: string;
  demoLink: string;
  repositoryLink: string;
  liveUrl: string;
  files: UploadedFile[];
};

type ProjectSubmissionFormProps = {
  title: string;
  helperMessage: string;
  buttonLabel: string;
  submitting: boolean;
  onSubmit: (data: ProjectSubmissionFormData) => void;
};

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-300 outline-none transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10";

export function ProjectSubmissionForm({
  title,
  helperMessage,
  buttonLabel,
  submitting,
  onSubmit,
}: ProjectSubmissionFormProps) {
  const [notes, setNotes] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [repositoryLink, setRepositoryLink] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const canSubmit = files.length > 0 && notes.trim().length > 0 && !submitting;

  return (
    <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          {title}
        </h2>
        <p className="text-slate-500 mt-1 leading-relaxed" style={{ fontSize: "0.78rem" }}>
          {helperMessage}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          Submission Notes <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Describe what you completed and mention any important review notes."
          className={`${inputCls} resize-none`}
          style={{ fontSize: "0.875rem" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          Demo Link <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={demoLink}
            onChange={(event) => setDemoLink(event.target.value)}
            placeholder="https://your-project-demo.com"
            className={`${inputCls} pl-10`}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          Repository Link <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={repositoryLink}
            onChange={(event) => setRepositoryLink(event.target.value)}
            placeholder="https://github.com/username/project"
            className={`${inputCls} pl-10`}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          Live URL <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={liveUrl}
            onChange={(event) => setLiveUrl(event.target.value)}
            placeholder="https://your-project.vercel.app"
            className={`${inputCls} pl-10`}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-slate-900 font-semibold" style={{ fontSize: "0.82rem" }}>
          Attachments <span className="text-red-400">*</span>
        </label>
        <FileUploadArea
          files={files}
          onAdd={(file) => setFiles((current) => [...current, file])}
          onRemove={(name) => setFiles((current) => current.filter((file) => file.name !== name))}
          maxFiles={5}
        />
      </div>

      <motion.button
        type="button"
        onClick={() => {
          if (!canSubmit) return;
          onSubmit({ notes, demoLink, repositoryLink, liveUrl, files });
        }}
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.02, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" } : {}}
        whileTap={canSubmit ? { scale: 0.97 } : {}}
        className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-colors ${
          canSubmit
            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
            : "bg-slate-100 text-slate-300 cursor-not-allowed"
        }`}
        style={{ fontSize: "0.9rem" }}
      >
        {submitting ? (
          <>
            <motion.span
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {buttonLabel}
          </>
        )}
      </motion.button>
    </section>
  );
}
