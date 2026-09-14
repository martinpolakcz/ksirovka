import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ActivityTile } from "@/lib/api";
import { encodeMediaUrl } from "@/lib/utils";

interface ActivityGridProps {
  tiles: ActivityTile[];
}

export function ActivityGrid({ tiles }: ActivityGridProps) {
  return (
    <section className="relative -mt-20 z-20 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7 md:gap-4">
          {tiles.map((tile, i) => {
            const isExternal = /^https?:\/\//i.test(tile.href);
            const className =
              "group relative block aspect-[3/4] overflow-hidden rounded-2xl md:rounded-3xl";
            const inner = (
              <>
                <img
                  src={encodeMediaUrl(tile.imageUrl)}
                  alt={tile.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <span className="text-sm font-semibold text-white md:text-base">
                    {tile.label}
                  </span>
                </div>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 transition group-hover:ring-teal/60" />
              </>
            );

            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                {isExternal ? (
                  <a
                    href={tile.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link to={tile.href} className={className}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
