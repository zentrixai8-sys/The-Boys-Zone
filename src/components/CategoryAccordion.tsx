import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CategoryAccordionItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  buttonText: string;
  image: string;
  link: string;
  objectPosition?: string;
}

const DEFAULT_CATEGORY_ITEMS: CategoryAccordionItem[] = [
  {
    id: 'oversized-tees',
    title: 'Oversized T-Shirts',
    tag: 'STREETWEAR',
    description: 'Drop-shoulder 240+ GSM heavyweight aesthetic graphic tees.',
    buttonText: 'EXPLORE TEES',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=60&w=600',
    link: '/products?category=Oversized+Tees',
    objectPosition: 'center 45%'
  },
  {
    id: 'casual-shirts',
    title: 'Casual & Printed Shirts',
    tag: 'CASUAL SHIRTS',
    description: 'Relaxed fit resort collars, textured flannels & urban overshirts.',
    buttonText: 'SHOP SHIRTS',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=60&w=600',
    link: '/products?category=Shirts',
    objectPosition: 'center 40%'
  },
  {
    id: 'anime-tees',
    title: 'Anime Graphic Tees',
    tag: 'GRAPHIC DROPS',
    description: 'Japanese anime, cyberpunk & underground graphic collector t-shirts.',
    buttonText: 'EXPLORE ANIME',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=60&w=600',
    link: '/products?category=Anime',
    objectPosition: 'center 38%'
  },
  {
    id: 'basic-tees',
    title: 'Minimal & Plain Tees',
    tag: 'EVERYDAY BASICS',
    description: 'Ultra-soft combed compact cotton plain luxury t-shirts & polos.',
    buttonText: 'SHOP BASICS',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=60&w=600',
    link: '/products?category=Basics',
    objectPosition: 'center 45%'
  },
  {
    id: 'hoodies',
    title: 'Hoodies & Sweatshirts',
    tag: 'WINTER LAYERS',
    description: 'Boxy 400 GSM fleece hoodies, oversized crewnecks & pullovers.',
    buttonText: 'VIEW HOODIES',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=60&w=600',
    link: '/products?category=Hoodies',
    objectPosition: 'center 42%'
  }
];

export const CategoryAccordion: React.FC<{ items?: CategoryAccordionItem[] }> = ({
  items = DEFAULT_CATEGORY_ITEMS
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto cycle active card every 4.5s when not hovered on desktop
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovering, items.length]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full overflow-hidden select-none"
      style={{ perspective: '1400px' }}
    >
      {/* Desktop / Tablet 3D Expanding Accordion Gallery */}
      <div className="hidden md:flex items-stretch gap-2.5 lg:gap-3.5 h-[480px] lg:h-[540px] w-full py-2">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          
          // Calculate 3D Inward Arc Tilt based on position relative to center/active
          const offset = index - activeIndex;
          const rotateY = isActive ? 0 : offset < 0 ? Math.min(18, Math.max(8, -offset * 6)) : Math.max(-18, Math.min(-8, -offset * 6));
          const scale = isActive ? 1 : 0.965;

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              onMouseEnter={() => setActiveIndex(index)}
              style={{
                flex: isActive ? 3.6 : 1,
                transform: `rotateY(${rotateY}deg) scale(${scale})`,
                transformOrigin: offset < 0 ? 'right center' : 'left center',
                transition: 'flex 550ms cubic-bezier(0.25, 1, 0.5, 1), transform 550ms cubic-bezier(0.25, 1, 0.5, 1), opacity 400ms ease',
              }}
              className={`relative overflow-hidden rounded-2xl lg:rounded-3xl cursor-pointer bg-zinc-950 border transition-colors duration-400 group shadow-[0_12px_36px_-12px_rgba(0,0,0,0.35)] ${
                isActive
                  ? 'border-white/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/20'
                  : 'border-white/10 hover:border-white/20 opacity-85 hover:opacity-100'
              }`}
            >
              {/* Background Image with curated objectPosition */}
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                style={{ objectPosition: item.objectPosition || 'center 15%' }}
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100 group-hover:scale-105 filter brightness-90'
                }`}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200';
                }}
              />

              {/* Dynamic Gradients - Top light & natural, bottom legible for text */}
              <div
                className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-500 ${
                  isActive
                    ? 'from-black/95 via-black/30 via-40% to-transparent opacity-100'
                    : 'from-black/85 via-black/35 via-50% to-transparent opacity-75 group-hover:opacity-45'
                }`}
              />

              {/* Top Tag Badge (Framer Style Pill) */}
              <div
                style={{
                  transition: 'opacity 350ms ease, transform 350ms ease',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(-10px)',
                }}
                className="absolute top-5 right-5 z-20"
              >
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Inactive Vertical Title Bar (When Collapsed) */}
              <div
                style={{
                  transition: 'opacity 300ms ease',
                  opacity: isActive ? 0 : 1,
                  pointerEvents: 'none',
                }}
                className="absolute inset-0 flex flex-col justify-end p-5 z-10"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/60" />
                  <p className="text-white/90 text-sm font-black uppercase tracking-wider truncate">
                    {item.title}
                  </p>
                </div>
              </div>

              {/* Active Expanded Content (Framer Style Reveal) */}
              <div
                style={{
                  transition: 'opacity 400ms ease 100ms, transform 400ms ease 100ms',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                className="absolute inset-x-0 bottom-0 p-6 lg:p-8 flex flex-col justify-end z-20"
              >
                <div className="max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 text-xs font-black uppercase tracking-widest">
                      Boys Collection
                    </span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-md leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-white/80 text-xs lg:text-sm font-medium leading-relaxed mb-5 line-clamp-2 drop-shadow">
                    {item.description}
                  </p>

                  <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all shadow-xl group/btn cursor-pointer">
                    <span>{item.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile / Small Screens Horizontal Touch Accordion */}
      <div className="md:hidden flex overflow-x-auto gap-3.5 pb-4 px-1 snap-x snap-mandatory hide-scrollbar">
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isActive) {
                  navigate(item.link);
                } else {
                  setActiveIndex(index);
                }
              }}
              className={`relative shrink-0 snap-center rounded-2xl overflow-hidden bg-zinc-950 border transition-all duration-300 shadow-md ${
                isActive
                  ? 'w-[280px] h-[340px] border-white/40 ring-1 ring-white/20'
                  : 'w-[160px] h-[340px] border-white/10 opacity-90'
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                style={{ objectPosition: item.objectPosition || 'center 15%' }}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 via-45% to-transparent" />

              {/* Tag for Active */}
              {isActive && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white text-[9px] font-black uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex flex-col justify-end">
                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight">
                  {item.title}
                </h4>
                {isActive ? (
                  <>
                    <p className="text-white/80 text-[11px] font-medium line-clamp-2 mt-1 mb-3">
                      {item.description}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold uppercase tracking-wider w-fit">
                      <span>{item.buttonText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                    Tap to expand
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
