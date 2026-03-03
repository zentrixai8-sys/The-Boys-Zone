import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShoppingBag, Shield, AlertTriangle, CreditCard, Truck } from 'lucide-react';
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

export const TermsAndConditions = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Legal Document</p>
            <h1 className="text-4xl font-black tracking-tight">Terms & Conditions</h1>
          </div>
        </div>
        <p className="text-white/50 mt-4">Last updated: March 2026 · The Boys Zone, Suhela, Madhya Pradesh, India</p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-16">

      <Section icon={FileText} title="About Us & Acceptance of Terms" color="bg-indigo-50 text-indigo-700">
        <p><strong className="text-black">The Boys Zone</strong> is a menswear retail store located at Suhela, in front of Bharat Petroleum, Madhya Pradesh, India. We sell clothing and accessories online and in-store.</p>
        <p>By visiting our website or making a purchase, you agree to these Terms and Conditions. These terms apply to all visitors, users, and customers. If you do not agree with these terms, please do not use our services.</p>
        <p>We may update these terms periodically. The updated date will be reflected at the top of this page. Continued use of our website after changes constitutes your acceptance of the revised terms.</p>
      </Section>

      <Section icon={ShoppingBag} title="Products & Pricing" color="bg-blue-50 text-blue-700">
        <p>All product descriptions, images, and prices displayed on our website are accurate to the best of our knowledge. In the event of a pricing error, we will notify you before processing your order and give you the option to confirm at the correct price or cancel.</p>
        <p>Prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</p>
        <p>Product availability is subject to stock levels and may change without prior notice. If an item becomes unavailable after you place an order, we will inform you and offer a full refund.</p>
        <p>We do not discriminate between customers based on race, religion, gender, nationality, disability, or any other protected characteristic.</p>
      </Section>

      <Section icon={CreditCard} title="Orders & Payments" color="bg-emerald-50 text-emerald-700">
        <p>An order is confirmed only after successful payment. You will receive an order confirmation via SMS or email.</p>
        <p>We accept UPI, debit/credit cards, net banking, and cash on delivery (where available). All online payments are processed securely by trusted payment gateways. We do not store card details.</p>
        <p>If your payment fails, please try again or contact us at +91 9617628157 for assistance.</p>
        <p>Orders may be cancelled by the customer before they are shipped. To cancel, contact us immediately after placing the order.</p>
      </Section>

      <Section icon={Truck} title="Shipping & Delivery" color="bg-orange-50 text-orange-700">
        <p>We deliver across India. Estimated delivery times are provided at checkout and are based on your location. These are estimates and may vary due to courier delays or public holidays.</p>
        <p>If your order is not delivered within <strong className="text-black">15 days</strong> of the expected delivery date, contact us and we will investigate immediately.</p>
        <p>Risk transfers to you upon delivery. Please inspect your package upon receipt and report any damage within 48 hours.</p>
        <p>For complete shipping details, see our <Link to="/shipping-policy" className="text-orange-600 hover:underline font-medium">Shipping Policy</Link>.</p>
      </Section>

      <Section icon={Shield} title="Intellectual Property" color="bg-purple-50 text-purple-700">
        <p>All content on this website — including product images, logos, text, and design — is owned by The Boys Zone and protected under Indian copyright law.</p>
        <p>You may not copy, reproduce, distribute, or commercially use any content without our prior written permission.</p>
        <p>Our trademarks and brand name may not be used in any way that could mislead customers or imply association with any other business.</p>
      </Section>

      <Section icon={AlertTriangle} title="Limitation of Liability" color="bg-red-50 text-red-700">
        <p>The Boys Zone is not liable for any indirect or consequential loss arising from the use of our website or products, except where required by law.</p>
        <p>Our maximum liability in any claim is limited to the amount you paid for the specific product or service in question.</p>
        <p>We are not responsible for delays caused by circumstances beyond our control, such as courier failures, natural events, or government restrictions. In such cases, we will communicate with you promptly and work to resolve the situation.</p>
        <p>Nothing in these terms limits your statutory consumer rights under the Consumer Protection Act, 2019 (India).</p>
      </Section>

      <div className="bg-black text-white p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-bold mb-2">Governing Law</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-1">These Terms are governed by the laws of India. Any disputes are subject to the jurisdiction of courts in Madhya Pradesh, India.</p>
        <p className="text-white/60 text-sm mb-6"><strong className="text-white">Contact:</strong> The Boys Zone · +91 9617628157 · Suhela, MP</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">Privacy Policy →</Link>
          <Link to="/return-policy" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">Return Policy →</Link>
          <Link to="/shipping-policy" className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">Shipping Policy →</Link>
        </div>
      </div>
    </div>
  </div>
);
