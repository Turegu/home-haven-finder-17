import { MapPin, Building, Calendar, ArrowUpRight } from 'lucide-react';
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
    units: number;
    completionDate: string;
  };
}

const FeaturedProjectCard = ({ project }: FeaturedProjectCardProps) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Completion badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider bg-foreground/80 backdrop-blur-sm text-background px-3 py-1.5 rounded-full">
            <Calendar className="h-3 w-3" />
            {project.completionDate}
          </span>
        </div>

        {/* Developer tag */}
        <div className="absolute top-3 right-3">
          <span className="text-[11px] font-medium bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full border border-border/50">
            {project.developer}
          </span>
        </div>

        {/* Price bar */}
        <div className="absolute bottom-0 inset-x-0 bg-primary/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-primary-foreground/70 uppercase tracking-wider font-medium">Starting from</p>
            <p className="text-base font-bold text-primary-foreground tracking-tight">
              ${project.priceFrom.toLocaleString()}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center group-hover:bg-primary-foreground/25 transition-colors">
            <ArrowUpRight className="h-4 w-4 text-primary-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {project.title}
        </h3>

        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <MapPin className="h-3.5 w-3.5 text-warm shrink-0" />
          <span className="line-clamp-1">{project.location}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building className="h-3.5 w-3.5" />
          <span>{project.units} units available</span>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedProjectCard;
