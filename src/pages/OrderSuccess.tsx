import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const OrderSuccess = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-16 pb-24 text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500">
          <Check className="w-6 h-6 text-emerald-500 stroke-3" />
        </div>
      </div>
      
      <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Order Placed!</h1>
      
      <p className="text-gray-500 font-medium text-[15px] mb-10 max-w-sm leading-relaxed">
        Thank you for shopping with The Boys Zone.<br/>
        Your order is being processed and will be shipped soon.
      </p>

      <Link 
        to="/" 
        className="w-full max-w-xs bg-gray-900 text-white py-4 rounded-xl text-[14px] font-bold hover:bg-black transition-colors shadow-lg shadow-black/10"
      >
        Back to Home
      </Link>
    </div>
  );
};
