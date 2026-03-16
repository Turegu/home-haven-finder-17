import { ArrowRight, MapPin, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSearch from '@/components/HeroSearch';
import PropertyCard from '@/components/PropertyCard';
import Footer from '@/components/Footer';
import { mockProperties, mockProjects, mockCities, partnerLogos } from '@/data/mockProperties';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSearch />

      {/* Featured Properties */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Properties</h2>
            <p className="text-sm text-muted-foreground mt-1">Handpicked properties for you</p>
          </div>
          <Link to="/buy" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProperties.filter(p => p.isFeatured).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Projects</h2>
              <p className="text-sm text-muted-foreground mt-1">New developments & off-plan projects</p>
            </div>
            <Link to="/projects" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div key={project.id} className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
                    <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      {project.completionDate}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Starting from</p>
                      <p className="text-sm font-bold text-foreground">${project.priceFrom.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="h-3.5 w-3.5" />
                      <span>{project.units} units</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Locations */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Locations</h2>
            <p className="text-sm text-muted-foreground mt-1">Browse properties by city</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockCities.map((city) => (
            <Link
              key={city.id}
              to={`/buy?city=${city.name}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden"
            >
              <img src={city.image} alt={city.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <h3 className="font-semibold text-sm">{city.name}</h3>
                <p className="text-[11px] text-white/70">{city.propertyCount.toLocaleString()} properties</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="bg-muted/50 py-12 overflow-hidden">
        <div className="container mx-auto px-4 mb-6">
          <h2 className="text-xl font-bold text-foreground text-center">Our Partners</h2>
        </div>
        <div className="relative">
          <div className="flex marquee whitespace-nowrap">
            {[...partnerLogos, ...partnerLogos].map((partner, i) => (
              <div key={`${partner.id}-${i}`} className="flex-shrink-0 mx-8">
                <div className="bg-card border border-border rounded-lg px-8 py-4 text-muted-foreground font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                  {partner.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
