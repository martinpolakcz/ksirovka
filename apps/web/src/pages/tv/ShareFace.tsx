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
            ? "h-full w-full origin-[center_25%] scale-[2.6] object-cover object-[center_25%]"
            : "h-full w-full object-cover object-center"
        }
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
