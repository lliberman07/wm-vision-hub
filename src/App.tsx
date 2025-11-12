import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PMSProvider } from "@/contexts/PMSContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { GranadaAuthProvider } from "@/contexts/GranadaAuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import GranadaAdmin from "./pages/GranadaAdmin";
import About from "./pages/About";
import Services from "./pages/Services";
import PropertyManagement from "./pages/PropertyManagement";
import RealEstateBrokerage from "./pages/RealEstateBrokerage";
import Consulting from "./pages/Consulting";
import RealEstateDevelopment from "./pages/RealEstateDevelopment";
import InvestmentServices from "./pages/InvestmentServices";
import Industries from "./pages/Industries";
import Financing from "./pages/Financing";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import { FinancingApplication } from "./pages/FinancingApplication";
import CreditSimulator from "./pages/CreditSimulator";
import ClientAdmin from "./pages/ClientAdmin";
import PMS from "./pages/PMS";
import PMSRequestAccess from "./pages/PMSRequestAccess";
import PMSLogin from "./pages/PMSLogin";
import PMSResetPassword from "./pages/PMSResetPassword";
import Subscribe from "./pages/pms/Subscribe";
import Properties from "./pages/pms/Properties";
import Owners from "./pages/pms/Owners";
import Tenants from "./pages/pms/Tenants";
import Contracts from "./pages/pms/Contracts";
import Payments from "./pages/pms/Payments";
import Maintenance from "./pages/pms/Maintenance";
import Reports from "./pages/pms/Reports";
import Expenses from "./pages/pms/Expenses";
import Indices from "./pages/pms/Indices";
import ExchangeRates from "./pages/pms/ExchangeRates";
import MyContract from "./pages/pms/MyContract";
import Receipts from "./pages/pms/Receipts";
import Help from "./pages/pms/Help";
import MySubscription from "./pages/pms/MySubscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <GranadaAuthProvider>
            <PMSProvider>
              <ClientProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <ScrollToTop />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/property-management" element={<PropertyManagement />} />
              <Route path="/services/brokerage" element={<RealEstateBrokerage />} />
              <Route path="/services/consulting" element={<Consulting />} />
              <Route path="/services/development" element={<RealEstateDevelopment />} />
              <Route path="/services/investments" element={<InvestmentServices />} />
              <Route path="/industries" element={<Industries />} />
        <Route path="/financing" element={<Financing />} />
        <Route path="/financing/apply" element={<FinancingApplication />} />
              <Route path="/financing/simulator" element={<Financing />} />
              <Route path="/credit-simulator" element={<CreditSimulator />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route path="/pms" element={<PMS />} />
              <Route path="/pms/login" element={<PMSLogin />} />
              <Route path="/pms/reset-password" element={<PMSResetPassword />} />
              <Route path="/pms/request-access" element={<PMSRequestAccess />} />
              <Route path="/pms/subscribe" element={<Subscribe />} />
              <Route path="/pms/properties" element={<Properties />} />
              <Route path="/pms/owners" element={<Owners />} />
              <Route path="/pms/tenants" element={<Tenants />} />
              <Route path="/pms/contracts" element={<Contracts />} />
              <Route path="/pms/payments" element={<Payments />} />
              <Route path="/pms/receipts" element={<Receipts />} />
              <Route path="/pms/maintenance" element={<Maintenance />} />
              <Route path="/pms/reports" element={<Reports />} />
              <Route path="/pms/expenses" element={<Expenses />} />
              <Route path="/pms/indices" element={<Indices />} />
              <Route path="/pms/exchange-rates" element={<ExchangeRates />} />
              <Route path="/pms/mi-contrato" element={<MyContract />} />
              <Route path="/pms/help" element={<Help />} />
              <Route path="/pms/my-subscription" element={<MySubscription />} />
              <Route path="/client-admin/*" element={<ClientAdmin />} />
              <Route path="/granada-admin/*" element={<GranadaAdmin />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
              </ClientProvider>
            </PMSProvider>
          </GranadaAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
