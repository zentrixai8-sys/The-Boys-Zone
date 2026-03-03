import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Eye, Lock, Bell, Trash2, Globe } from 'lucide-react';
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

export const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Shield className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Legal Document</p>
            <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-white/50 mt-4">Last updated: March 2026 · The Boys Zone, Suhela, Madhya Pradesh, India</p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-16">

      <Section icon={Shield} title="Introduction" color="bg-violet-50 text-violet-700">
        <p>The Boys Zone ("we", "our", or "us") is a retail menswear store located at Suhela, in front of Bharat Petroleum, Madhya Pradesh, India. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website (<strong className="text-black">theboyszone.in</strong>) or interact with us on social media platforms including Facebook and Instagram.</p>
        <p>By using our website or providing your information to us, you agree to the practices described in this policy.</p>
      </Section>

      <Section icon={Database} title="Information We Collect" color="bg-blue-50 text-blue-700">
        <p><strong className="text-black">Information you provide directly:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Name, email address, and phone number when you register</li>
          <li>Delivery address when you place an order</li>
          <li>Payment details (processed by secure third-party gateways — we do not store card numbers)</li>
        </ul>
        <p><strong className="text-black">Information collected automatically:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Pages visited, time spent, and browser/device type</li>
          <li>IP address and approximate location</li>
          <li>Referring website or social media platform</li>
        </ul>
      </Section>

      <Section icon={Globe} title="Meta (Facebook & Instagram) Data" color="bg-indigo-50 text-indigo-700">
        <p>We use <strong className="text-black">Meta Pixel</strong> (Facebook Pixel) on our website. This tool helps us measure the effectiveness of our advertising on Facebook and Instagram by collecting data about your activity on our website.</p>
        <p>The Meta Pixel may collect:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Pages you visit and products you view</li>
          <li>Actions you take (e.g., adding to cart, completing a purchase)</li>
          <li>Your IP address and browser information</li>
        </ul>
        <p>This data is shared with Meta Platforms, Inc. and is subject to <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Meta's Privacy Policy</a>. Meta may use this data to show you relevant ads on Facebook and Instagram.</p>
        <p>You can opt out of personalised ads by visiting <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Facebook Ad Preferences</a> or adjusting your device settings.</p>
      </Section>

      <Section icon={Eye} title="How We Use Your Information" color="bg-emerald-50 text-emerald-700">
        <p>We use collected information to:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Process and fulfil your orders</li>
          <li>Send order confirmations and delivery updates</li>
          <li>Provide customer support</li>
          <li>Improve our products and website</li>
          <li>Show relevant advertisements on Meta platforms (with your consent where required)</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We do <strong className="text-black">not</strong> use your personal data for automated decision-making or profiling that significantly affects you.</p>
      </Section>

      <Section icon={Lock} title="Data Sharing & Third Parties" color="bg-orange-50 text-orange-700">
        <p>We do <strong className="text-black">not sell your personal data</strong> to any third parties.</p>
        <p>We may share your information with:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li><strong className="text-black">Delivery partners</strong> — to ship your order (name, address, phone only)</li>
          <li><strong className="text-black">Payment processors</strong> — to complete transactions securely</li>
          <li><strong className="text-black">Meta Platforms, Inc.</strong> — via the Meta Pixel for advertising measurement (as described above)</li>
          <li><strong className="text-black">Legal authorities</strong> — if required by law or court order</li>
        </ul>
        <p>All third-party partners are required to maintain the confidentiality of your information.</p>
      </Section>

      <Section icon={Bell} title="Cookies" color="bg-amber-50 text-amber-700">
        <p>Our website uses cookies to improve your experience. Types of cookies we use:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li><strong className="text-black">Essential cookies</strong> — required for the website to function (login, cart)</li>
          <li><strong className="text-black">Analytics cookies</strong> — help us understand how users interact with our site</li>
          <li><strong className="text-black">Advertising cookies</strong> — set by Meta Pixel to measure ad performance</li>
        </ul>
        <p>You can control or delete cookies via your browser settings. Disabling essential cookies may affect site functionality.</p>
      </Section>

      <Section icon={Trash2} title="Your Rights" color="bg-red-50 text-red-700">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of marketing communications at any time</li>
          <li>Withdraw consent for data processing (where applicable)</li>
        </ul>
        <p>To exercise any of these rights, contact us at <strong className="text-black">+91 9617628157</strong> or via the <Link to="/contact" className="text-indigo-600 hover:underline font-medium">Contact page</Link>. We will respond within 30 days.</p>
      </Section>

      <Section icon={Shield} title="Data Security & Retention" color="bg-gray-50 text-gray-700">
        <p>We store your data on secure servers (Supabase) with industry-standard encryption and access controls.</p>
        <p>We retain your personal data only as long as necessary to fulfil the purposes described in this policy, or as required by law. Order data is retained for a minimum of 2 years for accounting and legal compliance.</p>
        <p>In the event of a data breach that affects your rights, we will notify you within 72 hours of becoming aware of it.</p>
      </Section>

      <div className="bg-black text-white p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-bold mb-2">Contact for Privacy Queries</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-2"><strong className="text-white">The Boys Zone</strong></p>
        <p className="text-white/60 text-sm">Suhela, in front of Bharat Petroleum, Madhya Pradesh, India</p>
        <p className="text-white/60 text-sm mb-6">Phone: +91 9617628157 · Instagram: @theboyszone_suhela</p>
        <Link to="/contact" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-colors">
          Contact Us →
        </Link>
      </div>
    </div>
  </div>
);
