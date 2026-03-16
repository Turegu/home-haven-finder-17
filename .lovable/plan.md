

## Plan: Build Turegu-Style Real Estate Home Page

Based on the live reference at terugu-web.vercel.app, I will replicate the full home page layout with all sections and the property card component.

### Files to Create/Edit

**1. Design System Update** (`src/index.css`)
- Teal/turquoise primary color (#009688), clean white background
- Import Inter font family
- Add custom CSS variables for the Turegu color scheme

**2. Shared Components**
- `src/components/Header.tsx` — Two-tier header:
  - **Top bar**: Flag + Language dropdown, Currency (USD), Area Unit (m²), Contact Us | Blogs | Advertise links
  - **Main nav**: Logo text "turegu", nav links (Buy, Rent, Projects, Events, Property Request, Agents), Login/Register button
- `src/components/Footer.tsx` — Logo, nav links, mobile app download section with phone mockup, copyright, Terms & Privacy links

**3. Hero Search Section** (`src/components/HeroSearch.tsx`)
- Full-width hero with background image and overlay
- Headline: "Your Property, Our Priority" + subtitle
- Buy/Rent toggle pills (teal active state)
- Search bar with Location dropdown + text input + Search button
- Filter row below: Property Type, Price, Area, Rooms, Bathrooms, Filters icon

**4. Property Listing Card** (`src/components/PropertyCard.tsx`)
- Image with photo count overlay, Compare + Favorite buttons
- Location with MapPin icon + full address
- Specs row: Property Type, Area (m²), Bathrooms, Rooms — each with icon + label
- Agent logo floating on card
- Price display

**5. Home Page Sections** (`src/pages/Index.tsx`)
- Featured Properties section — horizontal card grid with "View All" link
- Featured Projects section — same pattern
- Featured Locations section — city cards
- Our Partners — logo carousel (auto-scrolling)
- Mobile App Download — phone mockup + App Store / Play Store badges
- Footer

**6. Mock Data** (`src/data/mockProperties.ts`)
- Array of sample property objects with images, prices, specs, locations

**7. Routing** (`src/App.tsx`)
- Keep `/` as home, add placeholder routes for `/buy`, `/rent`, `/projects`, `/events`, `/property-request`, `/agents`, `/contact-us`, `/login`

### Technical Notes
- All data is static/mock — no backend needed
- Lucide React icons for all UI icons (MapPin, Heart, Layers, Phone, Mail, Bath, BedDouble, Maximize, Building, Filter, ChevronDown, Bell, Search, Globe, DollarSign, Ruler)
- Responsive: mobile hamburger menu, stacked cards on small screens
- Partner logos use CSS marquee animation for auto-scroll

