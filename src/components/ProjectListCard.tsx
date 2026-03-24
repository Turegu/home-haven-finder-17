import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Building, Maximize, Phone, Mail, Heart,
  ChevronLeft, ChevronRight, Camera, Calendar, Crown, Star, Tag
} from 'lucide-react';

const tagColorMap: Record<string, string> = {
  'Hot Deal': 'bg-red-500',
  'Price Drop': 'bg-green-600',
  'Exclusive': 'bg-purple-600',
  'New Launch': 'bg-teal-600',
};

export interface ProjectListCardProps {
  project: {
    id: string;
    title: string;
    project_type?: string;
    project_status?: string;
    min_price?: number | null;
    max_price?: number | null;
    currency?: string | null;
    min_units?: number | null;
    max_units?: number | null;
    developer?: string | null;
    province?: string | null;
    town?: string | null;
    neighbourhood?: string | null;
    location?: string | null;
    description?: string | null;
    images?: string[] | null;
    logo_url?: string | null;
    completion_date?: string | null;
    advertising_tags?: string[] | null;
    property_classification?: string | null;
    tagline?: string | null;
  };
}

const ProjectListCard = ({ project }: ProjectListCardProps) => {
  const { t } = useTranslation();
  const images = project.images && project.images.length > 0 ? project.images : ['/placeholder.svg'];
  const loc = project.location || [project.neighbourhood, project.town, project.province].filter(Boolean).join(', ');
  const [currentImage, setCurrentImage] = useState(0);
  const tier = project.property_classification;
  const adTags = project.advertising_tags ?? [];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const sideImages = images.length > 1 ? images.filter((_, i) => i !== currentImage).slice(0, 2) : [];
  const descriptionSnippet = project.description
    ? project.description.replace(/[#*_~`>]/g, '').slice(0, 180) + (project.description.length > 180 ? '…' : '')
    : null;

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col lg:flex-row">
          {/* Image mosaic area */}
          <div className="relative w-full lg:w-[520px] xl:w-[580px] shrink-0">
            {/* Top overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <Camera className="h-3 w-3" />
                <span>{currentImage + 1}/{images.length}</span>
              </div>
              {project.project_status && (
                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2.5 py-1 rounded shadow-sm">
                  {project.project_status}
                </span>
              )}
              {tier === 'premium' && (
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 shadow-md ml-auto" title="Premium">
                  <Crown className="h-4 w-4 text-white" />
                </span>
              )}
              {tier === 'featured' && (
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md ml-auto" title="Featured">
                  <Star className="h-4 w-4 text-white" />
                </span>
              )}
            </div>

            {/* Advertising tag */}
            {adTags.length > 0 && (
              <div className="absolute bottom-[44px] right-2 z-10">
                <Badge className={`${tagColorMap[adTags[0]] || 'bg-orange-500'} hover:${tagColorMap[adTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold shadow-md`}>
                  <Tag className="h-3 w-3" /> {adTags[0]}
                </Badge>
              </div>
            )}

            <div className="flex h-[220px] lg:h-[260px]">
              <div className="relative flex-[1.6] overflow-hidden">
                <img
                  src={images[currentImage]}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {images.length > 1 && (
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {images.length > 1 && (
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity lg:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {sideImages.length > 0 && (
                <div className="hidden lg:flex flex-col flex-1 gap-[2px] ml-[2px]">
                  <div className="relative flex-1 overflow-hidden">
                    <img src={sideImages[0]} alt={`${project.title} 2`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <img src={sideImages[1] || sideImages[0]} alt={`${project.title} 3`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {images.length > 1 && (
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price bar */}
            <div className="bg-primary px-4 py-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-primary-foreground/70 uppercase tracking-wider">{t('projectsPage.startingFrom', 'Starting from')}</span>
                <span className="text-lg font-bold text-primary-foreground ms-2">
                  {project.currency ?? 'TRY'} {(project.min_price ?? 0).toLocaleString()}
                </span>
              </div>
              {project.completion_date && (
                <span className="flex items-center gap-1.5 text-sm text-primary-foreground/90">
                  <Calendar className="h-3.5 w-3.5" /> {project.completion_date}
                </span>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">{project.title}</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-1">{loc}</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  <span className="font-medium text-foreground">{project.project_type}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  <span className="font-medium text-foreground">{project.max_units ?? 0} {t('projectsPage.units', 'units')}</span>
                </span>
              </div>
              {descriptionSnippet && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">{descriptionSnippet}</p>
              )}
              {project.tagline && (
                <p className="text-xs italic text-muted-foreground/80">{project.tagline}</p>
              )}
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                {project.logo_url && (
                  <img
                    src={project.logo_url}
                    alt={project.developer ?? project.title}
                    className="h-9 w-auto max-w-[100px] rounded object-contain border border-border px-2 py-1 bg-background"
                  />
                )}
                {project.developer && (
                  <span className="text-xs text-muted-foreground max-w-[140px] truncate">{project.developer}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Phone className="h-4 w-4" /> {t('projectsPage.call', 'Call')}
                </button>
                <div className="w-px h-5 bg-border" />
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Mail className="h-4 w-4" /> {t('projectsPage.email', 'Email')}
                </button>
                <div className="w-px h-5 bg-border" />
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Heart className="h-4 w-4" /> {t('projectsPage.save', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectListCard;
