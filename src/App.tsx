import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import BuyPage from "./pages/BuyPage.tsx";
import ProjectsPage from "./pages/ProjectsPage.tsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.tsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.tsx";
import AgentsPage from "./pages/AgentsPage.tsx";
import AgentDetailPage from "./pages/AgentDetailPage.tsx";
import CompanyDetailPage from "./pages/CompanyDetailPage.tsx";
import EventsPage from "./pages/EventsPage.tsx";
import EventDetailPage from "./pages/EventDetailPage.tsx";
import PropertyRequestPage from "./pages/PropertyRequestPage.tsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminCompaniesPage from "./pages/admin/AdminCompaniesPage.tsx";
import AdminCreateCompanyPage from "./pages/admin/AdminCreateCompanyPage.tsx";
import AdminMembershipsPage from "./pages/admin/AdminMembershipsPage.tsx";
import AdvertisePage from "./pages/AdvertisePage.tsx";
import AdminPropertiesPage from "./pages/admin/AdminPropertiesPage.tsx";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage.tsx";
import AdminEventsPage from "./pages/admin/AdminEventsPage.tsx";
import AdminBannersPage from "./pages/admin/AdminBannersPage.tsx";
import AdminBanksPage from "./pages/admin/AdminBanksPage.tsx";
import AdminLanguagesPage from "./pages/admin/AdminLanguagesPage.tsx";
import AdminCurrenciesPage from "./pages/admin/AdminCurrenciesPage.tsx";
import AdminCmsPage from "./pages/admin/AdminCmsPage.tsx";
import AdminCmsEditPage from "./pages/admin/AdminCmsEditPage.tsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.tsx";
import MortgageBanksPage from "./pages/MortgageBanksPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/rent" element={<BuyPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/company/:id" element={<CompanyDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/property-request" element={<PropertyRequestPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/companies/new" element={<AdminCreateCompanyPage />} />
          <Route path="/admin/memberships" element={<AdminMembershipsPage />} />
          <Route path="/advertise" element={<AdvertisePage />} />
          <Route path="/admin/properties" element={<AdminPropertiesPage />} />
          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/banners" element={<AdminBannersPage />} />
          <Route path="/admin/banks" element={<AdminBanksPage />} />
          <Route path="/admin/languages" element={<AdminLanguagesPage />} />
          <Route path="/admin/currencies" element={<AdminCurrenciesPage />} />
          <Route path="/admin/cms" element={<AdminCmsPage />} />
          <Route path="/admin/cms/:slug" element={<AdminCmsEditPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/mortgage-bank-loan" element={<MortgageBanksPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
