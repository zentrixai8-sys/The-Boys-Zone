import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, Phone } from 'lucide-react';
import { motion } from 'motion/react';

const Section = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white rounded-3xl border border-black/5 shadow-sm p-8 mb-6"
  >
    <div className={`inline-flex items-center gap-3 mb-5 px-4 py-2 rounded-2xl ${color}`}>
      <Icon className="w-5 h-5" />
      <h2 className="text-base font-bold">{title}</h2>
    </div>
    <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
  </motion.div>
);

export const ReturnPolicy = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <RotateCcw className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Policy Document</p>
            <h1 className="text-4xl font-black tracking-tight">Return & Exchange Policy</h1>
          </div>
        </div>
        <p className="text-white/50 mt-4">Last updated: March 2026 · The Boys Zone, Suhela, Madhya Pradesh, India</p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-16">

      <Section icon={Clock} title="Return Window" color="bg-blue-50 text-blue-700">
        <p>We accept return and exchange requests within <strong className="text-black">2 days</strong> of the delivery date for online orders.</p>
        <p>For in-store purchases, exchange requests must be made within <strong className="text-black">2 days</strong> of purchase with the original receipt.</p>
        <p>Items must be unused, unwashed, and in their original condition with all tags and packaging intact.</p>
      </Section>

      <Section icon={CheckCircle} title="Eligible for Return or Exchange" color="bg-emerald-50 text-emerald-700">
        <ul className="space-y-2">
          {[
            'Items received in a damaged or defective condition',
            'Wrong size or wrong item delivered compared to your order',
            'Items that are significantly different from the product description shown online'
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">To initiate a return, you must contact us within the return window. Requests made after the window will not be accepted.</p>
      </Section>

      <Section icon={XCircle} title="Not Eligible for Return" color="bg-red-50 text-red-700">
        <ul className="space-y-2">
          {[
            'Items that have been used, washed, or altered after delivery',
            'Items returned without original tags or packaging',
            'Items purchased during a final sale or clearly marked non-returnable at the time of purchase',
            'Accessories such as belts and wallets, once the packaging has been opened',
            'Return requests made after the 2-day return window'
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={RotateCcw} title="How to Request a Return" color="bg-purple-50 text-purple-700">
        <ol className="space-y-4">
          {[
            'Contact us on WhatsApp or call +91 9617628157 within 2 days of receiving your order.',
            'Share your Order ID and clear photos of the item showing the issue (damage, wrong item, etc.).',
            'Our team will review your request and respond within 2 business days with instructions.',
            'Ship the item back using a trackable courier (return shipping cost is borne by us if the item is defective or incorrectly delivered).',
            'Once the returned item is received and inspected, your exchange or refund will be processed within 5–7 business days.'
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4 list-none">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={AlertTriangle} title="Refunds" color="bg-amber-50 text-amber-700">
        <p>Approved refunds are credited to the <strong className="text-black">original payment method</strong> within <strong className="text-black">5–7 business days</strong> of us receiving and inspecting the returned item.</p>
        <p>Shipping charges paid at the time of order are refunded only if the return is due to a defective item or an incorrect delivery on our part.</p>
        <p>For in-store purchases, refunds are issued as store credit or an exchange. Cash refunds are not provided for in-store purchases.</p>
        <p>You will receive an email or SMS confirmation once your refund has been processed.</p>
      </Section>

      <div className="bg-black text-white p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-bold mb-2">Contact Us for Returns</h3>
        <p className="text-white/60 text-sm mb-6"><strong className="text-white">The Boys Zone</strong> · Suhela, in front of Bharat Petroleum, MP · Phone: +91 9617628157</p>
        <a href="tel:+919617628157" className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl text-sm font-bold transition-colors">
          <Phone className="w-4 h-4" /> Call / WhatsApp
        </a>
      </div>
    </div>
  </div>
);
