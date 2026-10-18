import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShareFaceProps = {
  src: string;
  alt?: string;
  className?: string;
  crop?: "face" | "card";
};

export function ShareFace({ src, alt = "", className, crop = "face" }: ShareFaceProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={
          crop === "card"
            ? "block h-full w-full origin-[center_25%] scale-[2.6] object-cover object-[center_25%]"
            : "block h-full w-full object-cover object-center"
        }
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

/** Zlatý kruh jako padding, ne jako `ring` — ten se s fotkou a overflow rozchází. */
export function TvFace({
  src,
  alt,
  sizeClassName,
  fallbackClassName,
  fallbackStyle,
  children,
}: {
  src: string | null;
  alt: string;
  sizeClassName: string;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={cn("box-border shrink-0 rounded-full bg-[#d4a853] p-[3px]", sizeClassName)}>
      {src ? (
        <ShareFace src={src} alt={alt} className="h-full w-full rounded-full" />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center overflow-hidden rounded-full",
            fallbackClassName,
          )}
          style={fallbackStyle}
        >
          {children}
        </div>
      )}
    </div>
  );
}
