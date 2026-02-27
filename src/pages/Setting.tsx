import React from 'react';
import { Settings, Shield, Bell, Key } from 'lucide-react';

export const Setting = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">Settings</h1>
        <p className="text-black/40">Manage your store configuration and preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold">General Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Store Name</label>
              <input type="text" defaultValue="The Boys Zone" className="w-full px-4 py-3 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black text-sm font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Support Email</label>
              <input type="email" defaultValue="support@theboyszone.com" className="w-full px-4 py-3 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black text-sm font-bold" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Security</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
            <div>
              <p className="font-bold text-sm">Two-Factor Authentication</p>
              <p className="text-xs text-black/40">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-white rounded-xl text-xs font-bold shadow-sm border border-black/5 hover:bg-gray-50">Enable</button>
          </div>
        </div>

        {/* System */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black" />
              <div>
                <p className="font-bold text-sm">Order Alerts</p>
                <p className="text-xs text-black/40">Receive notifications for new orders</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black" />
              <div>
                <p className="font-bold text-sm">Low Stock Warnings</p>
                <p className="text-xs text-black/40">Get notified when product stock falls below 10</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
