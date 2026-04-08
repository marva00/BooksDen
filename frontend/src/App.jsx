import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useEffect, useState } from 'react'
import Loading from './components/Loading'
import ChatbotWidget from './components/ai/ChatbotWidget'

const NAVBAR_SCROLL_OFFSET = 96;

const scrollToHashSection = (sectionId, behavior = 'smooth') => {
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return false;

  const nextTop = targetSection.getBoundingClientRect().top + window.scrollY - NAVBAR_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(nextTop, 0), behavior });
  return true;
};

function App() {

  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); 

    // Cleanup timer
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;

    const sectionId = decodeURIComponent(location.hash.replace('#', '')).trim();
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      const didScroll = scrollToHashSection(sectionId);
      if (!didScroll) {
        window.requestAnimationFrame(() => scrollToHashSection(sectionId));
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  if (loading) {
    return <Loading />; 
  }


  return (
    <div className='min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_34%,#f8fafc_100%)]'>
      <Navbar />
      <main className='min-h-screen max-w-screen-2xl mx-auto px-4 py-5 sm:py-8 font-primary'>
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />

    </div>
  )
}

export default App
