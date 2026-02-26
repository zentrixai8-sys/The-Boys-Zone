import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        <div className="space-y-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-gray-500 font-medium text-[15px] max-w-md">
              Have a question? Our team is here to help you find the perfect fit.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-500">support@boyszone.com</p>
                <p className="text-sm text-gray-500">press@boyszone.com</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Call Us</h3>
                <p className="text-sm text-gray-500">+91 9617628157</p>
                <p className="text-sm text-gray-500">Mon - Sat, 10am - 8pm</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Visit Us</h3>
                <p className="text-sm text-gray-500">Near Ripusudan Petrol Pump Suhela</p>
                <p className="text-sm text-gray-500">Baloda Bazar, CG</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Your Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-[13px] font-medium placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-[13px] font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Subject</label>
              <input 
                type="text" 
                placeholder="Product Inquiry"
                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-[13px] font-medium placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Message</label>
              <textarea 
                placeholder="Tell us what's on your mind..."
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-[13px] font-medium placeholder:text-gray-400 min-h-[140px] resize-y"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[14px] font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2 shadow-sm shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
