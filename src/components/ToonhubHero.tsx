import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// High-end 3D Character Figurines for Boys Fashion — Streetwear & Urban Looks
const TOONHUB_FIGURINES = [
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    fallback: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop',
    bg: '#F4845F',
    panel: '#F79B7F',
    tag: 'BOYS STREETWEAR',
    title: 'URBAN ATTITUDE',
    subtitle: 'Signature Oversized Hoodie & Premium Kicks',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    fallback: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
    bg: '#6BBF7A',
    panel: '#85CC92',
    tag: 'BOYS CASUAL',
    title: 'STREET BOMBER',
    subtitle: 'Classic Olive Green Jacket & Relaxed Fit',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    bg: '#E882B4',
    panel: '#ED9DC4',
    tag: 'BOYS RETRO',
    title: 'RETRO VARSITY',
    subtitle: 'Vintage 90s Aesthetic & Modern Street Drip',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    fallback: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
    bg: '#6EB5FF',
    panel: '#8DC4FF',
    tag: 'BOYS CYBER DRIP',
    title: 'FUTURISTIC LOOK',
    subtitle: 'Blue Tint Technical Outerwear & Accessories',
  },
];

export const ToonhubHero: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = React.useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const IMAGES = TOONHUB_FIGURINES;

  // Track window resize for responsive styling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload all 4 images on mount
  useEffect(() => {
    IMAGES.forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }, [IMAGES]);

  // Navigate logic with 650ms animation lock
  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setActiveIndex((prev) => (direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4));
    setTimeout(() => {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }, 650);
  }, []);

  // Automatic continuous auto-scroll every 3.8 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      navigate('next');
    }, 3800);
    return () => clearInterval(timer);
  }, [navigate, isPaused]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) navigate('next');
    if (diff < -50) navigate('prev');
    setTouchStart(null);
  };

  // Roles:
  // center = activeIndex
  // left = (activeIndex + 3) % 4
  // right = (activeIndex + 1) % 4
  // back = (activeIndex + 2) % 4
  const getRole = (index: number) => {
    if (index === activeIndex) return 'center';
    if (index === (activeIndex + 3) % 4) return 'left';
    if (index === (activeIndex + 1) % 4) return 'right';
    return 'back';
  };

  // TRUE CENTER-ALIGNED STYLES:
  // Characters are vertically and horizontally centered relative to the viewport,
  // perfectly overlapping the giant ghost text with zero cut-off!
  const getRoleStyle = (role: 'center' | 'left' | 'right' | 'back') => {
    switch (role) {
      case 'center':
        return {
          top: isMobile ? '50%' : '52%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${isMobile ? 1.18 : 1.45})`,
          transformOrigin: 'center center',
          filter: 'blur(0px)',
          opacity: 1,
          zIndex: 25,
          height: isMobile ? '64%' : '78%',
        };
      case 'left':
        return {
          top: isMobile ? '50%' : '52%',
          left: isMobile ? '16%' : '24%',
          transform: `translate(-50%, -50%) scale(${isMobile ? 0.65 : 0.72})`,
          transformOrigin: 'center center',
          filter: 'blur(2.5px)',
          opacity: 0.85,
          zIndex: 10,
          height: isMobile ? '44%' : '56%',
        };
      case 'right':
        return {
          top: isMobile ? '50%' : '52%',
          left: isMobile ? '84%' : '76%',
          transform: `translate(-50%, -50%) scale(${isMobile ? 0.65 : 0.72})`,
          transformOrigin: 'center center',
          filter: 'blur(2.5px)',
          opacity: 0.85,
          zIndex: 10,
          height: isMobile ? '44%' : '56%',
        };
      case 'back':
        return {
          top: isMobile ? '44%' : '45%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${isMobile ? 0.48 : 0.52})`,
          transformOrigin: 'center center',
          filter: 'blur(4.5px)',
          opacity: 0.65,
          zIndex: 5,
          height: isMobile ? '34%' : '44%',
        };
    }
  };

  const currentItem = IMAGES[activeIndex];

  return (
    <div
      style={{
        backgroundColor: currentItem.bg,
        transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full overflow-hidden" style={{ height: '85vh', minHeight: '500px' }}>
        {/* 1. Subtle Grain Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* 2. Top-left Brand Pill "THE BOYS ZONE" */}
        <div
          className="absolute top-6 left-4 sm:top-8 sm:left-10 flex items-center gap-2.5"
          style={{ zIndex: 60 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/15 backdrop-blur-md border border-white/20">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-bold uppercase text-white tracking-[0.2em]">
              THE BOYS ZONE
            </span>
            <span className="text-white/40 text-[10px]">•</span>
            <span className="text-[10px] font-semibold uppercase text-white/80 tracking-wider">
              {currentItem.tag}
            </span>
          </div>
        </div>

        {/* 4. Carousel Items — Centered on X and Y Axes */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {IMAGES.map((item, idx) => {
            const role = getRole(idx);
            const roleStyle = getRoleStyle(role);

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  aspectRatio: '0.6 / 1',
                  ...roleStyle,
                  transition:
                    'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), top 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform, filter, opacity, left, top, height',
                }}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  draggable={false}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== item.fallback) {
                      target.src = item.fallback;
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.22))',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 5. Bottom-left Text Info + Navigation Controls */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-12 sm:left-12"
          style={{ zIndex: 60, maxWidth: '380px' }}
        >
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest mb-2">
            {currentItem.tag}
          </div>

          <p
            className="font-black uppercase tracking-wider mb-1 sm:mb-2 text-xl sm:text-[26px] text-white leading-tight"
            style={{ letterSpacing: '0.01em' }}
          >
            {currentItem.title}
          </p>

          <p
            className="hidden sm:block text-xs sm:text-sm text-white/90 leading-[1.6] mb-5 font-normal"
          >
            {currentItem.subtitle}. The artwork is stunning, shipped fully prepared. The finish
            is a vision, the 3D craft is flawless.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('prev')}
              disabled={isAnimating}
              aria-label="Previous Outfit"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/15 hover:bg-white/25 active:scale-95 border-2 border-white text-white transition-all duration-150 cursor-pointer disabled:opacity-50 backdrop-blur-sm shadow-lg hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => navigate('next')}
              disabled={isAnimating}
              aria-label="Next Outfit"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/15 hover:bg-white/25 active:scale-95 border-2 border-white text-white transition-all duration-150 cursor-pointer disabled:opacity-50 backdrop-blur-sm shadow-lg hover:scale-105"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.25} />
            </button>

            {/* Slide Dots Indicator */}
            <div className="flex items-center gap-2 ml-4">
              {IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (isAnimating || i === activeIndex) return;
                    setIsAnimating(true);
                    setActiveIndex(i);
                    setTimeout(() => setIsAnimating(false), 650);
                  }}
                  aria-label={`Go to item ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-8 bg-white shadow-md' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 6. Bottom-right Link "DISCOVER IT" */}
        <Link
          to="/products"
          className="absolute bottom-6 right-4 sm:bottom-12 sm:right-12 flex items-center gap-2.5 group transition-all duration-200"
          style={{
            zIndex: 60,
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(22px, 3.8vw, 52px)',
            fontWeight: 400,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          <span className="group-hover:opacity-100 opacity-95 transition-opacity">DISCOVER IT</span>
          <ArrowRight
            className="w-5 h-5 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform duration-200"
            strokeWidth={2.25}
          />
        </Link>
      </div>
    </div>
  );
};
