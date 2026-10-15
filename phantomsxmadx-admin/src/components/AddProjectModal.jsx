import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function AddProjectModal({ isOpen, onClose, onSave, isLight }) {
  const [form, setForm] = useState({
    project: "",
    type: "Marketing", // Default to Marketing for subscriptions
    platform: "Web",
    owner: "Client",
    start: new Date().toISOString().split('T')[0],
    expiry: "",
    subscriptionFee: 0,
    subscriptionCategory: "SEO",
    isSubscription: true
  });

  const [loading, setLoading] = useState(false);

  const addProject = async (e) => {
    e.preventDefault();
    if (!form.project || !form.start) {
        toast.error("Project name and start date are required");
        return;
    }

    try {
      setLoading(true);
      const expiryDate = form.expiry ? new Date(form.expiry) : new Date(form.start);
      if (!form.expiry) expiryDate.setMonth(expiryDate.getMonth() + 1); // Default 1 month if not set

      const res = await api.post('/projects', {
        title: form.project,
        type: form.type,
        startDate: form.start, // Base start date
        deadline: expiryDate.toISOString(), // Base deadline
        status: 'active',
        description: `Monthly Subscription for ${form.project}`,
        platform: form.platform,
        owner: form.owner,
        // Detailed Subscription Fields
        isSubscription: true,
        subscriptionStartDate: form.start,
        subscriptionExpiryDate: expiryDate.toISOString(),
        subscriptionFee: form.subscriptionFee,
        subscriptionCategory: form.subscriptionCategory
      });

      if (res.data.success) {
        onSave(res.data.data || res.data.project);
        setForm({ 
            project: "", type: "Marketing", platform: "Web", owner: "Client", 
            start: new Date().toISOString().split('T')[0], expiry: "", 
            subscriptionFee: 0, subscriptionCategory: "SEO", isSubscription: true 
        });
        toast.success("Subscription Project created!");
        onClose();
      }
    } catch (error) {
      console.error("Failed to create project", error);
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl border transition-all duration-300 ${
              isLight ? 'bg-white border-gray-100' : 'bg-[#1e1b4b] border-[#312e81]'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#004AAD]/10 text-[#004AAD]">
                  <FiPlus size={20} />
                </div>
                <h2 className={`font-bold text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>New Subscription Project</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={addProject} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Project Name</label>
                <input
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400' : 'bg-[#151235] border-[#312e81] text-white placeholder-gray-500'
                  }`}
                  placeholder="e.g. Monthly SEO Client"
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Subscription Category</label>
                <select
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'
                  }`}
                  value={form.subscriptionCategory}
                  onChange={(e) => setForm({ ...form, subscriptionCategory: e.target.value })}
                >
                  <option value="SEO">SEO</option>
                  <option value="SMM">SMM (Social Media)</option>
                  <option value="Web Maintenance">Web Maintenance</option>
                  <option value="Lead Gen">Lead Generation</option>
                  <option value="Full Digital Marketing">Full Digital Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Monthly Fee ($)</label>
                <input
                  type="number"
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'
                  }`}
                  placeholder="0.00"
                  value={form.subscriptionFee}
                  onChange={(e) => setForm({ ...form, subscriptionFee: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Platform</label>
                <select
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'
                  }`}
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                >
                  <option value="Web">Web Application</option>
                  <option value="Mobile">Mobile Application</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Start Date</label>
                <input
                  type="date"
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'
                  }`}
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-secondary ml-1">Expiry Date (Next Renewal)</label>
                <input
                  type="date"
                  className={`w-full p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#004AAD]/20 focus:border-[#004AAD] ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#151235] border-[#312e81] text-white'
                  }`}
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="md:col-span-2 w-full mt-4 bg-[#004AAD] hover:bg-[#003882] text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xl shadow-[#004AAD]/20 disabled:opacity-50"
              >
                {loading ? "Creating..." : <><FiPlus /> Create Subscription Project</>}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
