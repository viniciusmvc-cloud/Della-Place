import About from '@/components/sections/About';
import Booking from '@/components/sections/Booking';
import CommunityWall from '@/components/sections/CommunityWall';
import FeaturedPizza from '@/components/sections/FeaturedPizza';
import Footer from '@/components/sections/Footer';
import Header from '@/components/sections/Header';
import Hero from '@/components/sections/Hero';
import HowItWorks from '@/components/sections/HowItWorks';
import MarqueeStrip from '@/components/sections/MarqueeStrip';
import Menu from '@/components/sections/Menu';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <MarqueeStrip />
        <FeaturedPizza />
        <About />
        <HowItWorks />
        <Menu />
        <Booking />
        <CommunityWall />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
