import { lazy, Suspense } from "react";
import { AuthPromptProvider } from "@/hooks/useAuthPrompt";
import { useDirection } from "@/hooks/useDirection";
import { Sentry } from "@/lib/sentry";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AreaUnitProvider } from "@/hooks/useAreaUnit";
import BackToTop from "@/components/BackToTop";

// Eager-load the homepage for instant first paint
import Index from "./pages/Index.tsx";

// Lazy-load all other pages — they load on demand
const BuyPage = lazy(() => import("./pages/BuyPage.tsx"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage.tsx"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage.tsx"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage.tsx"));
const AgentsPage = lazy(() => import("./pages/AgentsPage.tsx"));
const AgentDetailPage = lazy(() => import("./pages/AgentDetailPage.tsx"));
const CompanyDetailPage = lazy(() => import("./pages/CompanyDetailPage.tsx"));
const EventsPage = lazy(() => import("./pages/EventsPage.tsx"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage.tsx"));
const PropertyRequestPage = lazy(() => import("./pages/PropertyRequestPage.tsx"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage.tsx"));
const MortgageBanksPage = lazy(() => import("./pages/MortgageBanksPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.tsx"));
const BlogsPage = lazy(() => import("./pages/BlogsPage.tsx"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage.tsx"));
const FaqPage = lazy(() => import("./pages/FaqPage.tsx"));
const ContactUsPage = lazy(() => import("./pages/ContactUsPage.tsx"));

// User auth pages
const UserLoginPage = lazy(() => import("./pages/user/UserLoginPage.tsx"));
const UserRegisterPage = lazy(() => import("./pages/user/UserRegisterPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/user/ForgotPasswordPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/user/ResetPasswordPage.tsx"));

// User dashboard pages
const UserDashboardPage = lazy(() => import("./pages/user/UserDashboardPage.tsx"));
const AccountSettingsPage = lazy(() => import("./pages/user/AccountSettingsPage.tsx"));
const FollowedAgentsPage = lazy(() => import("./pages/user/FollowedAgentsPage.tsx"));
const AnnouncementsPage = lazy(() => import("./pages/user/AnnouncementsPage.tsx"));
const SavedPropertiesPage = lazy(() => import("./pages/user/SavedPropertiesPage.tsx"));
const SavedSearchesPage = lazy(() => import("./pages/user/SavedSearchesPage.tsx"));
const CompareListPage = lazy(() => import("./pages/user/CompareListPage.tsx"));
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage.tsx"));
const ContactedPropertiesPage = lazy(() => import("./pages/user/ContactedPropertiesPage.tsx"));
const PropertyRequestsUserPage = lazy(() => import("./pages/user/PropertyRequestsPage.tsx"));

// Admin pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage.tsx"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage.tsx"));
const AdminCompaniesPage = lazy(() => import("./pages/admin/AdminCompaniesPage.tsx"));
const AdminCreateCompanyPage = lazy(() => import("./pages/admin/AdminCreateCompanyPage.tsx"));
const AdminMembershipsPage = lazy(() => import("./pages/admin/AdminMembershipsPage.tsx"));
const AdminPropertiesPage = lazy(() => import("./pages/admin/AdminPropertiesPage.tsx"));
const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage.tsx"));
const AdminEventsPage = lazy(() => import("./pages/admin/AdminEventsPage.tsx"));
const AdminBannersPage = lazy(() => import("./pages/admin/AdminBannersPage.tsx"));
const AdminBanksPage = lazy(() => import("./pages/admin/AdminBanksPage.tsx"));
const AdminLanguagesPage = lazy(() => import("./pages/admin/AdminLanguagesPage.tsx"));
const AdminCurrenciesPage = lazy(() => import("./pages/admin/AdminCurrenciesPage.tsx"));
const AdminCmsPage = lazy(() => import("./pages/admin/AdminCmsPage.tsx"));
const AdminCmsEditPage = lazy(() => import("./pages/admin/AdminCmsEditPage.tsx"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage.tsx"));
const AdminBlogsPage = lazy(() => import("./pages/admin/AdminBlogsPage.tsx"));
const AdminBlogEditPage = lazy(() => import("./pages/admin/AdminBlogEditPage.tsx"));
const AdminFaqsPage = lazy(() => import("./pages/admin/AdminFaqsPage.tsx"));
const AdminFaqEditPage = lazy(() => import("./pages/admin/AdminFaqEditPage.tsx"));
const AdminCrudsPage = lazy(() => import("./pages/admin/AdminCrudsPage.tsx"));
const AdminFiltersPage = lazy(() => import("./pages/admin/AdminFiltersPage.tsx"));
const AdminLocationsPage = lazy(() => import("./pages/admin/AdminLocationsPage.tsx"));
const AdminEmailPreviewPage = lazy(() => import("./pages/admin/AdminEmailPreviewPage.tsx"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage.tsx"));
const AdminFeaturedManagementPage = lazy(() => import("./pages/admin/AdminFeaturedManagementPage.tsx"));
const AdminCompanyEditPage = lazy(() => import("./pages/admin/AdminCompanyEditPage.tsx"));
const AdminCompanyAgentsPage = lazy(() => import("./pages/admin/AdminCompanyAgentsPage.tsx"));

// Company pages
const CompanyLoginPage = lazy(() => import("./pages/company/CompanyLoginPage.tsx"));
const CompanyDashboardPage = lazy(() => import("./pages/company/CompanyDashboardPage.tsx"));
const CompanyProfilePage = lazy(() => import("./pages/company/CompanyProfilePage.tsx"));
const CompanyResetPasswordPage = lazy(() => import("./pages/company/CompanyResetPasswordPage.tsx"));
const CompanyPropertiesPage = lazy(() => import("./pages/company/CompanyPropertiesPage.tsx"));
const CompanyPropertyEditPage = lazy(() => import("./pages/company/CompanyPropertyEditPage.tsx"));
const CompanyProjectsPage = lazy(() => import("./pages/company/CompanyProjectsPage.tsx"));
const CompanyProjectEditPage = lazy(() => import("./pages/company/CompanyProjectEditPage.tsx"));
const CompanyProjectUnitsPage = lazy(() => import("./pages/company/CompanyProjectUnitsPage.tsx"));
const CompanyEventsPage = lazy(() => import("./pages/company/CompanyEventsPage.tsx"));
const CompanyEventEditPage = lazy(() => import("./pages/company/CompanyEventEditPage.tsx"));
const CompanyAgentsPage = lazy(() => import("./pages/company/CompanyAgentsPage.tsx"));
const CompanyAgentEditPage = lazy(() => import("./pages/company/CompanyAgentEditPage.tsx"));

const CompanyCreditHistoryPage = lazy(() => import("./pages/company/CompanyCreditHistoryPage.tsx"));
const CompanyInboxPage = lazy(() => import("./pages/company/CompanyInboxPage.tsx"));
const CompanyFollowersPage = lazy(() => import("./pages/company/CompanyFollowersPage.tsx"));

// Agent pages
const AgentLoginPage = lazy(() => import("./pages/agent/AgentLoginPage.tsx"));
const AgentDashboardPage = lazy(() => import("./pages/agent/AgentDashboardPage.tsx"));
const AgentProfilePage = lazy(() => import("./pages/agent/AgentProfilePage.tsx"));
const AgentPropertiesPage = lazy(() => import("./pages/agent/AgentPropertiesPage.tsx"));
const AgentProjectsPage = lazy(() => import("./pages/agent/AgentProjectsPage.tsx"));
const AgentEventsPage = lazy(() => import("./pages/agent/AgentEventsPage.tsx"));
const AgentFollowersPage = lazy(() => import("./pages/agent/AgentFollowersPage.tsx"));

const AgentInboxPage = lazy(() => import("./pages/agent/AgentInboxPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Global loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  useDirection();
  return (
  <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Something went wrong. Please refresh the page.</p></div>}>
  <QueryClientProvider client={queryClient}>
    <AreaUnitProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthPromptProvider>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/blog" element={<BlogsPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/advertise" element={<AdvertisePage />} />
            <Route path="/mortgage-bank-loan" element={<MortgageBanksPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />

            {/* User auth */}
            <Route path="/login" element={<UserLoginPage />} />
            <Route path="/register" element={<UserRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* User dashboard */}
            <Route path="/account" element={<UserDashboardPage />} />
            <Route path="/account/settings" element={<AccountSettingsPage />} />
            <Route path="/account/followed-agents" element={<FollowedAgentsPage />} />
            <Route path="/account/announcements" element={<AnnouncementsPage />} />
            <Route path="/account/saved-properties" element={<SavedPropertiesPage />} />
            <Route path="/account/saved-searches" element={<SavedSearchesPage />} />
            <Route path="/account/compare" element={<CompareListPage />} />
            <Route path="/account/notifications" element={<NotificationsPage />} />
            <Route path="/account/contacted" element={<ContactedPropertiesPage />} />
            <Route path="/account/requests" element={<PropertyRequestsUserPage />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/companies" element={<AdminCompaniesPage />} />
            <Route path="/admin/companies/new" element={<AdminCreateCompanyPage />} />
            <Route path="/admin/companies/:id/edit" element={<AdminCompanyEditPage />} />
            <Route path="/admin/companies/:id/agents" element={<AdminCompanyAgentsPage />} />
            <Route path="/admin/memberships" element={<AdminMembershipsPage />} />
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
            <Route path="/admin/blog" element={<AdminBlogsPage />} />
            <Route path="/admin/blog/:id" element={<AdminBlogEditPage />} />
            <Route path="/admin/faqs" element={<AdminFaqsPage />} />
            <Route path="/admin/faqs/:id" element={<AdminFaqEditPage />} />
            <Route path="/admin/cruds" element={<AdminCrudsPage />} />
            <Route path="/admin/filters" element={<AdminFiltersPage />} />
            <Route path="/admin/locations" element={<AdminLocationsPage />} />
            <Route path="/admin/email-templates" element={<AdminEmailPreviewPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/featured" element={<AdminFeaturedManagementPage />} />

            {/* Company */}
            <Route path="/company/login" element={<CompanyLoginPage />} />
            <Route path="/company" element={<CompanyDashboardPage />} />
            <Route path="/company/profile" element={<CompanyProfilePage />} />
            <Route path="/company/reset-password" element={<CompanyResetPasswordPage />} />
            <Route path="/company/properties" element={<CompanyPropertiesPage />} />
            <Route path="/company/properties/new" element={<CompanyPropertyEditPage />} />
            <Route path="/company/properties/:id/edit" element={<CompanyPropertyEditPage />} />
            <Route path="/company/projects" element={<CompanyProjectsPage />} />
            <Route path="/company/projects/new" element={<CompanyProjectEditPage />} />
            <Route path="/company/projects/:id/edit" element={<CompanyProjectEditPage />} />
            <Route path="/company/projects/:id/units" element={<CompanyProjectUnitsPage />} />
            <Route path="/company/events" element={<CompanyEventsPage />} />
            <Route path="/company/events/new" element={<CompanyEventEditPage />} />
            <Route path="/company/events/:id/edit" element={<CompanyEventEditPage />} />
            <Route path="/company/agents" element={<CompanyAgentsPage />} />
            <Route path="/company/agents/new" element={<CompanyAgentEditPage />} />
            <Route path="/company/agents/:id/edit" element={<CompanyAgentEditPage />} />
            
            <Route path="/company/credits" element={<CompanyCreditHistoryPage />} />
            <Route path="/company/inbox" element={<CompanyInboxPage />} />
            <Route path="/company/followers" element={<CompanyFollowersPage />} />

            {/* Agent */}
            <Route path="/agent/login" element={<AgentLoginPage />} />
            <Route path="/agent" element={<AgentDashboardPage />} />
            <Route path="/agent/profile" element={<AgentProfilePage />} />
            <Route path="/agent/properties" element={<AgentPropertiesPage />} />
            <Route path="/agent/projects" element={<AgentProjectsPage />} />
            <Route path="/agent/events" element={<AgentEventsPage />} />
            <Route path="/agent/followers" element={<AgentFollowersPage />} />
            
            <Route path="/agent/inbox" element={<AgentInboxPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </AuthPromptProvider>
      </BrowserRouter>
      <BackToTop />
    </TooltipProvider>
    </AreaUnitProvider>
  </QueryClientProvider>
  </Sentry.ErrorBoundary>
  );
};

export default App;
