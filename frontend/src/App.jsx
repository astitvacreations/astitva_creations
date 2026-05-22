import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import { useServiceStore } from './store/serviceStore';
import { useProjectStore } from './store/projectStore';
import { useTestimonialStore } from './store/testimonialStore';
import { useSettingStore } from './store/settingStore';
import OfflineDetector from './components/OfflineDetector';
import ToastContainer from './components/ToastContainer';
import LoadingScreen from './components/LoadingScreen';

// Lazy load all pages for better performance
const Home = lazy(() => import('./pages/Home'));
const QuoteWizard = lazy(() => import('./pages/QuoteWizard'));
const Projects = lazy(() => import('./pages/Projects'));
const EventGallery = lazy(() => import('./pages/EventGallery'));
const Services = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ProjectEvents = lazy(() => import('./pages/ProjectEvents'));
const ServiceGallery = lazy(() => import('./pages/ServiceGallery'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Feedback = lazy(() => import('./pages/Feedback'));
const WeddingLandingPage = lazy(() => import('./pages/WeddingLandingPage'));
const PreWeddingLandingPage = lazy(() => import('./pages/PreWeddingLandingPage'));
const VRWeddingLandingPage = lazy(() => import('./pages/VRWeddingLandingPage'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const RequestFeedback = lazy(() => import('./pages/admin/RequestFeedback'));
const ProjectsManager = lazy(() => import('./pages/admin/ProjectsManager'));
const ServicesManager = lazy(() => import('./pages/admin/ServicesManager'));
const QuotesManager = lazy(() => import('./pages/admin/QuotesManager'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const PricingEditor = lazy(() => import('./pages/admin/PricingEditor'));
const DeveloperOptions = lazy(() => import('./pages/admin/DeveloperOptions'));
const TestimonialsManager = lazy(() => import('./pages/admin/TestimonialsManager'));
const LandingPagesManager = lazy(() => import('./pages/admin/LandingPagesManager'));
const LeadsManager = lazy(() => import('./pages/admin/LeadsManager'));
const Inquire = lazy(() => import('./pages/Inquire'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const { fetchServices } = useServiceStore();
  const { fetchProjects } = useProjectStore();
  const { fetchTestimonials } = useTestimonialStore();
  const { fetchSettings, settings, initialized } = useSettingStore();

  useEffect(() => {
    fetchServices();
    fetchProjects();
    fetchTestimonials();
    fetchSettings();
  }, []);

  // Dynamically inject Google Analytics & Meta Pixel script elements based on settings
  useEffect(() => {
    if (!settings) return;

    // ── Google Analytics ──
    if (settings.googleAnalyticsId) {
      const gaId = settings.googleAnalyticsId.trim();
      if (gaId && !document.getElementById('google-analytics-script')) {
        const script1 = document.createElement('script');
        script1.id = 'google-analytics-script';
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.id = 'google-analytics-config';
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(script2);
      }
    }

    // ── Meta Pixel ──
    if (settings.metaPixelId) {
      const pixelId = settings.metaPixelId.trim();
      if (pixelId && !document.getElementById('meta-pixel-script')) {
        const script = document.createElement('script');
        script.id = 'meta-pixel-script';
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);

        const noscript = document.createElement('noscript');
        noscript.id = 'meta-pixel-noscript';
        noscript.innerHTML = `
          <img height="1" width="1" style="display:none"
          src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />
        `;
        document.head.appendChild(noscript);
      }
    }
  }, [settings]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin opacity-50"></div>
      </div>
    );
  }

  return (
    <>
      <LoadingScreen />
      <OfflineDetector />
      <ToastContainer />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="quote" element={<QuoteWizard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:serviceSlug" element={<ProjectEvents />} />
            <Route path="projects/:serviceSlug/:eventSlug" element={<EventGallery />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:serviceSlug" element={<ServiceGallery />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="wedding-landing-page" element={<WeddingLandingPage />} />
            <Route path="prewedding-landing-page" element={<PreWeddingLandingPage />} />
            <Route path="vrwedding-landing-page" element={<VRWeddingLandingPage />} />
            <Route path="inquire" element={<Inquire />} />
          </Route>
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="landing-pages" element={<LandingPagesManager />} />
            <Route path="pricing" element={<PricingEditor />} />
            <Route path="quotes" element={<QuotesManager />} />
            <Route path="leads" element={<LeadsManager />} />
            <Route path="testimonials" element={<TestimonialsManager />} />
            <Route path="feedback" element={<RequestFeedback />} />
            <Route path="settings" element={<Settings />} />
            <Route path="developer" element={<DeveloperOptions />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
