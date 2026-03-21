import { MapPin, Calendar, ArrowUpRight, Building } from 'lucide-react';
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
  };
}

const FeaturedProjectCard = ({ project }: FeaturedProjectCardProps) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-card"
    >
      {/* Full image background */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
        />

        {/* Gradient scrim — only bottom half */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Top: delivery pill */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/90 backdrop-blur text-foreground text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
          <Calendar className="h-3 w-3 text-primary" />
          {project.completionDate}
        </div>

        {/* Arrow on hover */}
        <div className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <ArrowUpRight className="h-4 w-4 text-white" />
        </div>

        {/* Bottom overlaid content */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-3">
          {/* Developer with logo */}
          <div className="flex items-center gap-2">
            {project.developerLogo ? (
              <img src={project.developerLogo} alt={project.developer} className="h-5 w-5 rounded object-contain" />
            ) : (
              <div className="h-5 w-5 rounded bg-white/15 flex items-center justify-center">
                <Building className="h-3 w-3 text-white/70" />
              </div>
            )}
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/60">
              {project.developer}
            </span>
          </div>

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
            <span className="text-[11px] text-white/50 font-medium">
              {project.units} units
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedProjectCard;
