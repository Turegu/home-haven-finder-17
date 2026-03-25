import { MapPin, Calendar, ArrowUpRight, Building, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedProjectCardProps {
  project: {
    id: string;
    title: string;
    location: string;
    priceFrom: number;
    currency: string;
    image: string;
    developer: string;
    developerLogo?: string;
    units: number;
    completionDate: string;
    advertisingTags?: string[];
  };
}

const tagColorMap: Record<string, string> = {
  'Hot Deal': 'bg-red-500',
  'Price Drop': 'bg-green-600',
  'Exclusive': 'bg-purple-600',
  'New Launch': 'bg-teal-600',
};

const FeaturedProjectCard = ({ project }: FeaturedProjectCardProps) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-card"
    >
      {/* Full image background */}
      <div className="relative aspect-[6/7] overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
        />

        {/* Gradient scrim — only bottom half */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Top-left: developer logo */}
        <div className="absolute top-4 left-4">
          {project.developerLogo ? (
            <img src={project.developerLogo} alt={project.developer} className="h-7 w-auto max-w-[64px] object-contain rounded bg-white shadow-sm px-1.5 py-1" />
          ) : (
            <div className="h-7 w-7 rounded bg-white/90 shadow-sm flex items-center justify-center">
              <Building className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Top-right: arrow + tag */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
          {project.advertisingTags?.[0] && (
            <span className={`${tagColorMap[project.advertisingTags[0]] || 'bg-orange-500'} text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
              <Tag className="h-3 w-3" /> {project.advertisingTags[0]}
            </span>
          )}
        </div>

        {/* Bottom overlaid content */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-3">
          {/* Developer name */}
          <span className="text-[11px] font-medium uppercase tracking-widest text-white/60">
            {project.developer}
          </span>

          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-white leading-tight tracking-tight text-wrap-balance">
            {project.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-white/70 text-xs">
            <MapPin className="h-3.5 w-3.5 text-warm shrink-0" />
            <span>{project.location}</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/15" />

          {/* Footer row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Starting from</p>
              <p className="text-lg font-bold text-white tracking-tight">
                ${project.priceFrom.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] text-white/50 font-medium">
                {project.units} units
              </span>
              <span className="flex items-center gap-1 text-[11px] text-white/60 font-medium">
                <Calendar className="h-3 w-3 text-primary" />
                {project.completionDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedProjectCard;
