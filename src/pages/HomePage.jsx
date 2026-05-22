import DashboardPreview from '../components/DashboardPreview.jsx'
import FeatureCards from '../components/FeatureCards.jsx'
import FloatingParticles from '../components/FloatingParticles.jsx'
import Footer from '../components/Footer.jsx'
import HeroSection from '../components/HeroSection.jsx'
import Navbar from '../components/Navbar.jsx'
import PricingSection from '../components/PricingSection.jsx'
import Testimonials from '../components/Testimonials.jsx'
import WhyChoose from '../components/WhyChoose.jsx'
import WorkflowTimeline from '../components/WorkflowTimeline.jsx'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1F3A] text-[#F8F6F0]">
      <FloatingParticles />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <FeatureCards />
        <DashboardPreview />
        <WhyChoose />
        <WorkflowTimeline />
        <Testimonials />
        <PricingSection />
        <Footer />
      </div>
    </div>
  )
}
