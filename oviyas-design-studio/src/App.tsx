import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Menu, X, ArrowUpRight, ArrowDown, ChevronUp } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register ScrollToPlugin
gsap.registerPlugin(ScrollToPlugin);

// Star/Dust Canvas Fallback Tracker
const StarField: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.4,
      opacity: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.04 + 0.015,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((s) => {
        s.y -= s.speed;
        if (s.y < 0) {
          s.y = height;
          s.x = Math.random() * width;
        }

        s.opacity += s.twinkleSpeed * s.direction;
        if (s.opacity > 0.75 || s.opacity < 0.1) {
          s.direction *= -1;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, Math.min(0.8, s.opacity))})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="cosmic-starfield-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-1"
      style={{ mixBlendMode: 'screen', opacity }}
    />
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isJourneyDialogOpen, setIsJourneyDialogOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Loading & Preloading States
  const [loadingPercentage, setLoadingPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Canvas Refs & Variables
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Constants
  const TOTAL_FRAMES = 259;
  const ZOOM_FACTOR = 1.05;

  // Preload Frame Sequence
  useEffect(() => {
    let loaded = 0;
    const tempImages: HTMLImageElement[] = [];

    const handleImageLoad = () => {
      loaded++;
      const percentage = Math.round((loaded / TOTAL_FRAMES) * 100);
      setLoadingPercentage(percentage);

      if (loaded === TOTAL_FRAMES) {
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };

    const handleImageError = (e: any) => {
      console.warn("Failed to load a cinematic sequence frame. Continuing.", e);
      handleImageLoad();
    };

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, '0');
      img.src = `/frames/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      tempImages.push(img);
    }

    imagesRef.current = tempImages;
  }, []);

  // Frame Draw Math Simulator (Object-Fit: Cover inside HTML5 Canvas Context)
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    // Dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear back frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      // Viewport is wider than image aspect ratio: crop top/bottom
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // Viewport is taller than image aspect ratio: crop left/right
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    // Apply Zoom factor to hide baked letterboxes
    const zoom = ZOOM_FACTOR;
    const zoomedWidth = drawWidth * zoom;
    const zoomedHeight = drawHeight * zoom;

    const finalOffsetX = offsetX - (zoomedWidth - drawWidth) / 2;
    const finalOffsetY = offsetY - (zoomedHeight - drawHeight) / 2;

    ctx.drawImage(img, finalOffsetX, finalOffsetY, zoomedWidth, zoomedHeight);
  };

  // Resize canvas & draw current frame
  useEffect(() => {
    if (isLoading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrameRef.current);
    };

    // Initial trigger
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(0);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading]);

  // Scroll to Frame mapping sequence
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    if (isLoading) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

          if (maxScroll <= 0) return;

          const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
          setScrollProgress(scrollFraction);

          const frameIndex = Math.min(
            TOTAL_FRAMES - 1,
            Math.floor(scrollFraction * TOTAL_FRAMES)
          );

          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);

          // Update active highlights in header based on scroll position
          if (scrollFraction < 0.22) {
            setActiveTab('Home');
          } else if (scrollFraction >= 0.22 && scrollFraction < 0.47) {
            setActiveTab('Studio');
          } else if (scrollFraction >= 0.47 && scrollFraction < 0.72) {
            setActiveTab('About');
          } else {
            setActiveTab('Journal');
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // First trigger
    drawFrame(0);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  // Dynamic Cursor Interactive Parallax
  useEffect(() => {
    if (isLoading) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      // Normalizing cursor to -0.5 to 0.5 coordinate offset
      const normX = (clientX / window.innerWidth) - 0.5;
      const normY = (clientY / window.innerHeight) - 0.5;

      const offsetPixel = 45; // Subtle movement to maintain scale margin
      const moveX = -normX * offsetPixel;
      const moveY = -normY * offsetPixel;

      gsap.to(canvasRef.current, {
        x: moveX,
        y: moveY,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLoading]);

  // Programmatic GSAP Glide scroll trigger
  const scrollToPercentage = (fraction: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = maxScroll * fraction;
    gsap.to(window, {
      scrollTo: targetScroll,
      duration: 1.6,
      ease: 'power3.inOut'
    });
  };

  const handleRouteClick = (link: string) => {
    setIsMobileMenuOpen(false);
    if (link === 'Home') {
      scrollToPercentage(0);
    } else if (link === 'About') {
      scrollToPercentage(0.32);
    } else if (link === 'Services') {
      scrollToPercentage(0.62);
    } else if (link === 'Project') {
      scrollToPercentage(0.88);
    } else if (link === 'Reach Us') {
      setIsJourneyDialogOpen(true);
    }
  };

  const handleCTAAction = () => {
    setIsJourneyDialogOpen(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail.trim()) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsJourneyDialogOpen(false);
        setTimeout(() => {
          setIsSubmitted(false);
          setUserEmail('');
        }, 500);
      }, 3000);
    }
  };

  const quoteList = [
    { text: "Where creativity meet reality", author: "Oviyas Design Studio" },
    { text: "Web, UX UI Design Agency in Chennai and across globe", author: "Rajkumar" },
    { text: "Behind every design there is a UX stands.", author: "Design Principle" }
  ];

  // Esc key modal binder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsJourneyDialogOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigationLinks = ['Home', 'About', 'Services', 'Project', 'Reach Us'];

  return (
    <div className="relative w-full bg-black text-white selection:bg-white/20 selection:text-white font-body overflow-x-hidden">

      {/* Cinematic Load Progress Overlay Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            id="cinematic-scrolly-loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-8"
          >
            {/* Ambient Background stars in loading screen */}
            <StarField opacity={0.6} />

            <div className="relative z-10 text-center max-w-md w-full">
              {/* Elegant Logo */}
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="Oviyas Logo" className="h-32 w-auto" />
              </div>
              <p className="text-[10px] text-muted-foreground/60 tracking-[0.25em] uppercase mb-16">
                DISPATCH PREPARATION
              </p>

              {/* Progress counter */}
              <div className="relative mb-4 flex items-center justify-between text-xs tracking-widest text-muted-foreground">
                <span className="uppercase">PRELOADING CINEMATICS</span>
                <span className="font-mono text-white font-medium">{String(loadingPercentage).padStart(3, '0')}%</span>
              </div>

              {/* Swiss Progress minimalist line indicator */}
              <div className="w-full h-[1px] bg-white/10 rounded-full overflow-hidden mb-6">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingPercentage}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              <p className="text-[10px] text-muted-foreground/40 italic">
                Optimizing high-performance frame memory arrays...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED BACKDROP BACKGROUND - SCROLLY CANVAS & STAR OVERLAYS */}
      <div
        id="scrollytelling-cinematic-stage"
        className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-black overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          id="cinematic-video-frame-canvas"
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none"
          style={{ transformOrigin: 'center center' }}
        />

        {/* Soft Vignette Overlay to lock typography to frame grids */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none z-1" />
        <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none z-1" />

        {/* Continuous star drift overlays on top of the sequence to create visual depth */}
        <StarField opacity={0.3} />
      </div>

      {/* HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 w-full z-30 transition-all duration-300">
        <nav
          id="oviyas-glassmorphic-navbar"
          className="flex flex-row justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full"
        >
          <a
            href="#home"
            id="nav-logo"
            className="flex items-center transition-opacity hover:opacity-90 outline-none focus:ring-1 focus:ring-white/20 p-1 rounded"
            onClick={(e) => { e.preventDefault(); handleRouteClick('Home'); }}
          >
            <img src="/logo.png" alt="Oviyas Logo" className="h-20 w-auto object-contain" />
          </a>

          {/* Desktop Links */}
          <div id="desktop-links" className="hidden md:flex items-center space-x-10">
            {navigationLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                id={`nav-${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleRouteClick(link);
                }}
                className={`text-sm tracking-wide transition-colors relative py-1 focus:outline-none focus:text-white ${activeTab === link
                  ? 'text-white font-medium'
                  : 'text-muted-foreground hover:text-white'
                  }`}
              >
                {link}
                {activeTab === link && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </div>

          {/* Action buttons */}
          <div id="nav-actions" className="flex items-center space-x-4">
            {/* CTA Button */}
            <button
              onClick={handleCTAAction}
              id="header-cta-begin-journey"
              className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform duration-300 focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer hidden sm:block"
            >
              Contact us
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              id="mobile-menu-hamburger"
              className="md:hidden p-2 text-muted-foreground hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20 rounded"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* FLOATING VERTICAL DOT NAVIGATION INDICATOR PANEL */}
      <div
        id="cinematic-dots-progress-panel"
        className="fixed right-8 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center space-y-5"
      >
        {[
          { name: 'Home', fraction: 0 },
          { name: 'Studio', fraction: 0.32 },
          { name: 'About', fraction: 0.62 },
          { name: 'Journal', fraction: 0.88 }
        ].map((dot, idx) => {
          const isCurrent = activeTab === dot.name;
          return (
            <button
              key={dot.name}
              onClick={() => scrollToPercentage(dot.fraction)}
              className="group flex items-center justify-end relative py-1 focus:outline-none focus:ring-1 focus:ring-white/10"
              title={`Scroll to ${dot.name}`}
            >
              {/* Tooltip Label */}
              <span className="absolute right-7 text-[10px] tracking-widest text-muted-foreground/0 group-hover:text-white transition-all duration-300 font-medium uppercase select-none pointer-events-none">
                {dot.name}
              </span>

              {/* Circular Dot Indicator */}
              <div
                className={`w-2 h-2 rounded-full border transition-all duration-500 ${isCurrent
                  ? 'bg-white border-white scale-125'
                  : 'bg-transparent border-white/35 group-hover:border-white group-hover:scale-110'
                  }`}
              />
            </button>
          );
        })}
      </div>

      {/* SMOOTH GSAP SCROLL TO TOP FLOATING ACTION BUTTON */}
      <div
        id="scroll-to-top-fab-wrapper"
        className={`fixed bottom-8 right-8 z-30 transition-all duration-500 ${scrollProgress > 0.15 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <button
          onClick={() => scrollToPercentage(0)}
          className="p-3.5 rounded-full liquid-glass text-white hover:scale-[1.07] transition-transform duration-300 focus:outline-none focus:ring-1 focus:ring-white/40 shadow-xl"
          title="Glide to Top"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* LONG SCROLLABLE STORYTELLING CONTAINER LAYOUT OVERLAYS */}
      <main id="main-scrollytelling-content" className="relative z-10 w-full flex flex-col">

        {/* ACT I: HERO / LANDING */}
        <section
          id="act-one-hero"
          className="h-screen w-full flex flex-col justify-center items-center text-center px-6 relative"
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Animated Title */}
            <motion.h1
              id="hero-primary-quote"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-5xl sm:text-7xl md:text-8xl tracking-[-2.46px] leading-[0.95] max-w-7xl font-normal text-white select-none"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Oviyas Design Studio
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                id="hero-specialty-subtext"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                className="text-yellow-400 text-xl sm:text-3xl max-w-xl mt-2 leading-relaxed font-semibold tracking-wide selection:bg-yellow-200/20"
              >
                Creative. Web / UX UI Design Agency
              </motion.p>

             {/* Subtitle */}
            <motion.p
              id="hero-secondary-subtext"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="text-white-400 text-base sm:text-lg max-w-xl mt-8 leading-relaxed font-light tracking-wide selection:bg-white/10"
            >
              3 International award winning design studio in India. We deliver design that moves business forward — from brand identity to high-converting user experiences.
            </motion.p>

            {/* Primary Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              className="mt-12"
            >
              <button
                onClick={() => scrollToPercentage(0.32)}
                className="liquid-glass rounded-full px-12 py-4.5 text-sm text-white hover:scale-[1.03] duration-300 transition-transform cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50 inline-flex items-center group gap-2.5 font-medium shadow-2xl"
              >
                Get started
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </motion.div>
          </div>

          {/* Animated Scroll Hint */}
          <div className="absolute bottom-10 flex flex-col items-center space-y-1.5 animate-bounce">
            <span className="text-[10px] tracking-widest text-muted-foreground/60 uppercase">SCROLL TO DRIFT</span>
            <ArrowDown className="w-4.5 h-4.5 text-muted-foreground/50" />
          </div>
        </section>

        {/* ACT II: THE STUDIO CRAFT */}
        <section
          id="act-two-studio"
          className="h-screen w-full flex items-center justify-start px-8 sm:px-16 md:px-24 relative"
        >
          <div className="max-w-xl w-full">
            {/* Visual spacer representation for height trigger */}
            <span className="text-[16px] tracking-[0.3em] text-muted-foreground/50 uppercase block mb-3 font-medium font-mono">
              About Us
            </span>

           <h2
  className="text-4xl sm:text-6xl tracking-tight font-normal leading-[0.98] mb-6 bg-gradient-to-r from-blue-400 via-green-500 to-red-500 bg-clip-text text-transparent"
  style={{ fontFamily: "'Instrument Serif', serif" }}
>
  We Define User Experiences Through AI-Powered Innovative, Intuitive, and Impactful Designs!
</h2>

            <p className="text-white-400 font-light text-sm sm:text-base leading-relaxed tracking-wide mb-8">
              Our focus is on crafting intuitive interfaces and meaningful digital experiences that delight users and drive measurable business growth. India. We partner with ambitious brands to build memorable digital experiences — from brand identity to high-converting web design.
            </p>

            <p className="text-white-400 font-light text-sm sm:text-base leading-relaxed tracking-wide mb-8">
              Founded by designer over 2 decades of enterprise design experience, our team blends strategic thinking with pixel-perfect craft to move businesses forward.
            </p>

            <div className="flex flex-row items-center gap-6">
              <button
                onClick={() => scrollToPercentage(0.62)}
                className="liquid-glass rounded-full px-8 py-3.5 text-xs text-white hover:scale-[1.02] duration-300 transition-transform cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50 inline-flex items-center gap-2 group uppercase tracking-widest"
              >
                The Philosophy
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </section>

        

        {/* ACT III: FOCUS PHILOSOPHY */}
        <section
          id="act-three-philosophy"
          className="h-screen w-full flex items-center justify-end px-8 sm:px-16 md:px-24 relative"
        >
          <div className="max-w-xl w-full text-right flex flex-col items-end">
            <span className="text-[10px] tracking-[0.3em] text-muted-foreground/50 uppercase block mb-3 font-medium font-mono">
              ACT III // THE FOCUS THEORY
            </span>

            <h2
              className="text-4xl sm:text-6xl text-white tracking-tight font-normal leading-[0.98] mb-6"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Behind every sharp alignment lies a pool of deep attention.
            </h2>

            <p className="text-muted-foreground/80 font-light text-sm sm:text-base leading-relaxed tracking-wide mb-8 max-w-lg">
              We reject high-frequency notification loops and aggressive trackers. Oviyas Design Studio stands for slow-tech. Our screens breathe with space, giving your attention span the buffer it needs to do true, profound work.
            </p>

            <button
              onClick={() => scrollToPercentage(0.88)}
              className="liquid-glass rounded-full px-8 py-3.5 text-xs text-white hover:scale-[1.02] duration-300 transition-transform cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50 inline-flex items-center gap-2 group uppercase tracking-widest"
            >
              Secure Passage
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </section>

        {/* ACT IV: THE JOURNAL & ENTRY GATEWAY */}
        <section
          id="act-four-journal"
          className="min-h-screen w-full flex flex-col justify-between items-center text-center px-6 pt-32 pb-8 relative"
        >
          {/* Centered signup card */}
          <div className="my-auto max-w-lg w-full liquid-glass rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl relative">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/5 rounded-full border border-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>

            <span className="text-[9px] tracking-[0.3em] text-muted-foreground/50 uppercase block mb-2 font-mono">
              FINAL DISPATCH CHANNEL
            </span>
            <h2
              className="text-3xl sm:text-4xl font-normal tracking-tight text-white mb-3"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Enter The Undercurrent
            </h2>

            <p className="text-muted-foreground/80 text-xs sm:text-sm leading-relaxed mb-8 max-w-sm mx-auto font-light">
              Join our private journal list. We dispatch raw dispatches, design patterns, and slow-tech reflections every full moon. No tracking. Zero noise.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-sm mx-auto">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-full text-white placeholder:text-muted-foreground/40 text-xs focus:outline-none focus:border-white/40 transition-colors tracking-wide pl-12"
                />
                <Sparkles className="w-4 h-4 text-muted-foreground/45 absolute left-5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
              >
                Secure Passage
                <ArrowUpRight className="w-4 h-4 text-black/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>

            <p className="mt-5 text-[9px] text-muted-foreground/40 uppercase tracking-widest font-mono">
              Strict privacy. Your coordinates remain strictly yours.
            </p>
          </div>

          {/* FOOTER METADATA */}
          <footer className="w-full max-w-7xl mx-auto pt-16 border-t border-white/5 px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60 tracking-widest uppercase font-mono">
            <div id="footer-left" className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-ping" />
              <span>EST. 2026 // SWISS MODERNISM</span>
            </div>
            <div id="footer-right" className="flex items-center space-x-6">
              <span className="hover:text-white transition-colors cursor-pointer" onClick={() => scrollToPercentage(0.62)}>OUR MISSION</span>
              <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setIsJourneyDialogOpen(true)}>NEWSLETTER</span>
              <span>SHARP FOCUS</span>
            </div>
          </footer>
        </section>

      </main>

      {/* MOBILE NAV DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-drawer-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden flex flex-col justify-between p-8 pt-24"
          >
            <div id="mobile-links-wrapper" className="flex flex-col space-y-8 text-left mt-8">
              {navigationLinks.map((link, index) => (
                <motion.a
                  key={link}
                  id={`mobile-nav-${link.toLowerCase().replace(/\s+/g, '-')}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRouteClick(link)}
                  className={`text-3xl font-normal tracking-tight focus:outline-none ${activeTab === link
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white'
                    }`}
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {link}
                </motion.a>
              ))}
            </div>

            <div id="mobile-drawer-footer" className="flex flex-col gap-6">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsJourneyDialogOpen(true);
                }}
                id="mobile-drawer-cta"
                className="w-full text-center liquid-glass rounded-full py-4 text-white text-base font-medium"
              >
                Begin Journey
              </button>

              <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 tracking-wider font-mono">
                <span>Oviyas Design Studio</span>
                <span>Chennai, India</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BEGIN JOURNEY MODAL DIALOG */}
      <AnimatePresence>
        {isJourneyDialogOpen && (
          <motion.div
            id="journey-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={(e) => {
              if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                setIsJourneyDialogOpen(false);
              }
            }}
          >
            <motion.div
              ref={dialogRef}
              id="journey-dialog-container"
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="liquid-glass w-full max-w-lg rounded-3xl p-8 sm:p-10 text-center relative border border-white/10 shadow-2xl"
            >
              <button
                onClick={() => setIsJourneyDialogOpen(false)}
                id="close-dialog-button"
                className="absolute top-6 right-6 p-1.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all focus:outline-none focus:ring-1 focus:ring-white/40"
                aria-label="Close dialogue"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="dialog-form-step"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <div className="flex justify-center mb-6">
                      <div className="p-3 bg-white/5 rounded-full border border-white/10 animate-pulse">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <h2
                      className="text-3xl font-normal tracking-tight text-white mb-3"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      Enter The Undercurrent
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm mx-auto font-light">
                      Join our private journal list. We dispatch raw dispatches, design patterns, and slow-tech reflections every full moon. No noise.
                    </p>

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="Your email address"
                          id="journey-email-input"
                          className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-full text-white placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-white/45 transition-colors tracking-wide pl-12"
                        />
                        <Sparkles className="w-4.5 h-4.5 text-muted-foreground/45 absolute left-5 top-1/2 -translate-y-1/2" />
                      </div>

                      <button
                        type="submit"
                        id="dialog-submit-button"
                        className="w-full py-3.5 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg hover:shadow-white/5 cursor-pointer flex items-center justify-center gap-2 group"
                      >
                        Secure Passage
                        <ArrowUpRight className="w-4 h-4 text-black/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </form>

                    <p className="mt-5 text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono">
                      Your space remains strictly yours — zero tracking.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dialog-success-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="py-6"
                  >
                    <div className="flex justify-center mb-6">
                      <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white text-xl animate-bounce">
                        ✓
                      </div>
                    </div>

                    <h2
                      className="text-3xl font-normal tracking-tight text-white mb-2"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      Passage Secured
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto mb-4 font-light">
                      You are now aligned. We will send you your coordinates and our first dispatch on the next phase.
                    </p>

                    <blockquote className="italic text-muted-foreground/60 text-xs py-4 px-6 border-l border-white/10 bg-white/2 max-w-sm mx-auto rounded-r-lg">
                      {quoteList[Math.floor(Math.random() * quoteList.length)].text}
                    </blockquote>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
