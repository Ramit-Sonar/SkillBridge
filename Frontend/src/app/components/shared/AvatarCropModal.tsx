import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { motion } from "motion/react";
import { X } from "lucide-react";

const OUTPUT_SIZE = 1024;
const DEFAULT_ZOOM = 2.2;
const MIN_ZOOM = 1.65;
const MAX_ZOOM = 4.5;
const MAX_AVATAR_SOURCE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const AVATAR_FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const validateAvatarImageFile = (file: File) => {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return "Only JPG, JPEG, PNG and WEBP image files are allowed.";
  }

  if (file.size > MAX_AVATAR_SOURCE_SIZE) {
    return "Please choose an image smaller than 10 MB.";
  }

  return "";
};

type AvatarCropModalProps = {
  file: File;
  initials: string;
  currentAvatar?: string;
  loading?: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void> | void;
};

const getCropSize = () => {
  if (typeof window === "undefined") return { width: 260, height: 260 };

  if (window.innerWidth < 420) return { width: 210, height: 210 };
  if (window.innerWidth < 768) return { width: 230, height: 230 };

  return { width: 260, height: 260 };
};

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.crossOrigin = "anonymous";
    image.src = url;
  });

const getCroppedAvatarFile = async (imageUrl: string, crop: Area) => {
  const image = await createImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Avatar crop could not be prepared.");
  }

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.save();
  context.beginPath();
  context.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.restore();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.92)
  );

  if (!blob) {
    throw new Error("Avatar crop could not be prepared.");
  }

  return new File([blob], "avatar.webp", { type: "image/webp" });
};

export function AvatarCropModal({
  file,
  initials,
  currentAvatar,
  loading = false,
  onClose,
  onSave,
}: AvatarCropModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [cropSize, setCropSize] = useState(getCropSize);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const nextImageUrl = URL.createObjectURL(file);
    setImageUrl(nextImageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(DEFAULT_ZOOM);

    return () => {
      URL.revokeObjectURL(nextImageUrl);
    };
  }, [file]);

  useEffect(() => {
    const handleResize = () => {
      setCropSize(getCropSize());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    if (!imageUrl || !croppedAreaPixels) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const previewFile = await getCroppedAvatarFile(imageUrl, croppedAreaPixels);
        const nextPreviewUrl = URL.createObjectURL(previewFile);

        if (cancelled) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        setPreviewUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return nextPreviewUrl;
        });
      } catch {
        // The main save action will surface crop errors if canvas generation fails.
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [croppedAreaPixels, imageUrl]);

  const handleSave = async () => {
    if (!imageUrl || !croppedAreaPixels || loading) return;

    const croppedFile = await getCroppedAvatarFile(imageUrl, croppedAreaPixels);
    await onSave(croppedFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-slate-950 font-bold" style={{ fontSize: "1rem" }}>
              Position Profile Picture
            </h2>
            <p className="mt-1 text-slate-500" style={{ fontSize: "0.8rem" }}>
              Drag your photo so your face, hair, neck, and upper shoulders fill the avatar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close avatar cropper"
            className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid min-h-0 gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_180px]">
          <div className="flex flex-col">
            <div className="relative h-[clamp(210px,40vh,380px)] overflow-hidden rounded-3xl bg-slate-950">
              {imageUrl && (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  cropSize={cropSize}
                  showGrid={false}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  objectFit="contain"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>
          </div>

          <aside className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900" style={{ fontSize: "0.82rem" }}>
              Preview
            </p>
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-teal-500 shadow-sm sm:h-32 sm:w-32">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Cropped avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Current avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                  {initials}
                </div>
              )}
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <motion.span
                    className="h-5 w-5 rounded-full border-2 border-blue-600/25 border-t-blue-600"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              )}
            </div>
            <p
              className="max-w-36 text-center leading-relaxed text-slate-400"
              style={{ fontSize: "0.72rem" }}
            >
              This is how your picture will appear across SkillBridge.
            </p>
          </aside>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-50"
            style={{ fontSize: "0.85rem" }}
          >
            Cancel
          </button>
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={loading || !croppedAreaPixels}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-70"
            style={{ fontSize: "0.85rem" }}
          >
            {loading ? (
              <>
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Uploading...
              </>
            ) : (
              "Save Profile Picture"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
