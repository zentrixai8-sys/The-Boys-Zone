import React from 'react';

export const About = () => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="space-y-8 pr-4 lg:pr-12">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-gray-900 mb-6">
            The Boys Zone Vision
          </h1>
          
          <div className="space-y-6">
            <p className="text-gray-600 font-medium text-[15px] leading-relaxed">
              Since our inception in 2021, <span className="text-gray-900 font-bold">The Boys Zone</span> has been dedicated to redefining men's fashion. We started as a small boutique in the heart of London, driven by the desire to create garments that we ourselves would want to wear.
            </p>
            <p className="text-gray-600 font-medium text-[15px] leading-relaxed">
              Every piece in our collection is meticulously crafted with attention to detail, fabric selection, and fit. We don't just sell clothes; we provide the building blocks for your confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div>
              <h3 className="text-3xl font-bold text-indigo-600 mb-2">50k+</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-indigo-600 mb-2">200+</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Unique Styles</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-4/5 rounded-[32px] overflow-hidden bg-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780&auto=format&fit=crop" 
              alt="About The Boys Zone" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="absolute -bottom-8 -left-8 right-8 bg-indigo-600 rounded-[24px] p-8 shadow-xl">
            <p className="text-white text-[15px] font-serif italic leading-relaxed">
              "Style is a way to say who you are without having to speak."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
