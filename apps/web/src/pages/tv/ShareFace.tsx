import { cn } from "@/lib/utils";

type ShareFaceProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function ShareFace({ src, alt = "", className }: ShareFaceProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full origin-[center_25%] scale-[2.6] object-cover object-[center_25%]"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
