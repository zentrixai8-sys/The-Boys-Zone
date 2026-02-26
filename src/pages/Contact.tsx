import React from 'react';
import { Phone, MapPin, Instagram, User, Store } from 'lucide-react';
import { motion } from 'motion/react';

export const Contact = () => {
  return (
    <div className="min-h-screen bg-[#f8f8f8] py-12 lg:py-24 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-md text-black mb-8 shadow-3d-soft"
          >
            <Store className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Store Information</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[6rem] font-serif font-black tracking-tighter text-black mb-6 uppercase leading-none text-3d"
          >
            THE BOYS <br className="md:hidden" />
            <span className="italic font-light ml-0 md:ml-6">ZONE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-black/60 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Your premium destination for menswear. Visit us in-store for curated collections and exceptional service.
          </motion.p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
          
          {/* Director Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[32px] border-4 border-white image-3d group flex flex-col items-center text-center hover:scale-105 transition-transform duration-500"
          >
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-3d-pop group-hover:-translate-y-2 transition-transform duration-300">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2">Director</h3>
            <p className="text-2xl font-black text-black">Bhupendra</p>
          </motion.div>

          {/* Contact Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-[32px] border-4 border-white image-3d group flex flex-col items-center text-center hover:scale-105 transition-transform duration-500"
          >
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-3d-pop group-hover:-translate-y-2 transition-transform duration-300">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2">Contact</h3>
            <a href="tel:+919617628157" className="text-2xl font-black text-black hover:text-indigo-600 transition-colors">
              +91 9617628157
            </a>
          </motion.div>

          {/* Instagram Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-[32px] border-4 border-white image-3d group flex flex-col items-center text-center hover:scale-105 transition-transform duration-500"
          >
             <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-3d-pop group-hover:-translate-y-2 transition-transform duration-300">
              <Instagram className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2">Instagram</h3>
            <a href="https://instagram.com/theboyszone_suhela" target="_blank" rel="noopener noreferrer" className="text-lg font-black text-black hover:text-pink-600 transition-colors break-all">
              @theboyszone_suhela
            </a>
          </motion.div>

          {/* Address Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-8 rounded-[32px] border-4 border-white image-3d group flex flex-col items-center text-center hover:scale-105 transition-transform duration-500 md:col-span-2 lg:col-span-1"
          >
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-3d-pop group-hover:-translate-y-2 transition-transform duration-300">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2">Address</h3>
            <p className="text-lg font-bold text-black leading-snug">
              सुहेला, Bharat Petroleum के सामने
            </p>
          </motion.div>

        </div>
        
        {/* Large Aesthetic Image at bottom */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="mt-24 w-full h-[400px] md:h-[600px] rounded-[40px] overflow-hidden image-3d border-8 border-white bg-black relative group cursor-pointer"
        >
           <img 
             src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop" 
             alt="Store Interior" 
             className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105"
           />
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-6xl md:text-9xl font-black text-white/90 uppercase tracking-tighter text-3d drop-shadow-2xl">
                 VISIT US
              </h2>
           </div>
        </motion.div>

      </div>
    </div>
  );
};
