import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Clock, MapPin, Package, AlertTriangle, Phone } from 'lucide-react';
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

export const ShippingPolicy = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Truck className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Policy Document</p>
            <h1 className="text-4xl font-black tracking-tight">Shipping Policy</h1>
          </div>
        </div>
        <p className="text-white/50 mt-4">Last updated: March 2026 · The Boys Zone, Suhela, Madhya Pradesh, India</p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-16">

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Local (Suhela & nearby)', time: '1–2 Days', color: 'from-emerald-500 to-teal-400' },
          { label: 'Within Madhya Pradesh', time: '3–5 Days', color: 'from-blue-500 to-cyan-400' },
          { label: 'Rest of India', time: '5–8 Days', color: 'from-orange-500 to-amber-400' },
        ].map(({ label, time, color }) => (
          <div key={label} className={`bg-linear-to-br ${color} text-white p-6 rounded-3xl text-center shadow-lg`}>
            <p className="text-2xl font-black mb-1">{time}</p>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </motion.div>

      <Section icon={Clock} title="Order Processing Time" color="bg-blue-50 text-blue-700">
        <p>Orders are processed within <strong className="text-black">1–2 business days</strong> after payment confirmation (Monday to Saturday, excluding public holidays).</p>
        <p>You will receive an order confirmation via SMS or WhatsApp immediately after your order is placed. A shipping confirmation with tracking details will be sent once your order is dispatched.</p>
        <p>Orders placed after 5:00 PM are processed on the next business day.</p>
      </Section>

      <Section icon={Truck} title="Shipping Charges" color="bg-orange-50 text-orange-700">
        <p><strong className="text-black">Free shipping</strong> on all orders above <strong className="text-black">₹999</strong>.</p>
        <p>Orders below ₹999 are charged a flat shipping fee of <strong className="text-black">₹60</strong>.</p>
        <p>The exact shipping charge is shown at checkout before you complete your payment — there are no hidden charges.</p>
      </Section>

      <Section icon={MapPin} title="Delivery Locations" color="bg-emerald-50 text-emerald-700">
        <p>We deliver to all states and union territories across <strong className="text-black">India</strong>.</p>
        <p>We do not currently ship outside India.</p>
        <p>For Suhela and nearby areas, we also offer <strong className="text-black">same-day delivery</strong> on orders placed before 12:00 PM, subject to availability. Please confirm by calling us at +91 9617628157.</p>
      </Section>

      <Section icon={Package} title="Order Tracking" color="bg-purple-50 text-purple-700">
        <p>Once your order is dispatched, you will receive a tracking number via SMS or WhatsApp. Use this to track your shipment on the carrier's website.</p>
        <p>You can also view your order status anytime from your <Link to="/profile" className="text-indigo-600 hover:underline font-medium">Profile → Orders</Link> section.</p>
        <p>If you have not received your tracking details within 3 business days of your order, please contact us.</p>
      </Section>

      <Section icon={AlertTriangle} title="Late, Damaged, or Lost Deliveries" color="bg-amber-50 text-amber-700">
        <p>If your order has not arrived within <strong className="text-black">15 days</strong> of the expected delivery date, contact us immediately. We will investigate and either resend the order or issue a full refund.</p>
        <p>If your package arrives damaged, take photos of the packaging and items and contact us within <strong className="text-black">48 hours</strong> of delivery. We will arrange a replacement or refund at no additional cost.</p>
        <p>Delivery delays caused by natural disasters, strikes, or other events beyond our control are not our liability, but we will keep you updated and work to resolve the situation as quickly as possible.</p>
      </Section>

      <div className="bg-black text-white p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-bold mb-2">Shipping Queries</h3>
        <p className="text-white/60 text-sm mb-6"><strong className="text-white">The Boys Zone</strong> · Suhela, in front of Bharat Petroleum, MP · +91 9617628157</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="tel:+919617628157" className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-2xl text-sm font-bold transition-colors">
            <Phone className="w-4 h-4" /> Call / WhatsApp
          </a>
          <Link to="/contact" className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-sm font-bold transition-colors">
            Contact Us →
          </Link>
        </div>
      </div>
    </div>
  </div>
);
