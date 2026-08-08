type BrandLogoMarkProps = {
  className?: string;
};

const LOGO_SRC = "/temp/logo.png";

export function BrandLogoMark({ className = "w-12 h-9" }: BrandLogoMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-lg bg-white border border-black/[0.06] shadow-sm shrink-0 ${className}`}
    >
      <img src={LOGO_SRC} alt="SkillBridge logo" className="w-full h-full object-contain" />
    </span>
  );
}
