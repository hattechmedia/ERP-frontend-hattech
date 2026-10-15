import { useState } from "react";
import { FiX, FiSend, FiBell } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function AnnouncementModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide both title and description");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/announcements", {
        title: title.trim(),
        description: description.trim(),
        type,
        date: date || new Date().toISOString().split('T')[0]
      });

      if (res.data.success) {
        toast.success("Announcement published successfully!");
        if (onCreated) onCreated(res.data.announcement);
        setTitle("");
        setDescription("");
        setType("general");
        setDate(new Date().toISOString().split('T')[0]);
        onClose();
      }
    } catch (err) {
      console.error("Failed to publish announcement", err);
      toast.error(err.response?.data?.message || "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-b from-[#161a29] to-[#0d101a] border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-lg">
              <FiBell />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Publish Announcement</h3>
              <p className="text-xs text-slate-400">Broadcast notices, holidays & events to all staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Office Holiday Notice / Annual Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 transition dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 transition dark:[color-scheme:dark]"
              >
                <option value="holiday">🏖️ Holiday / Off Notice</option>
                <option value="event">🎉 Event & Celebration</option>
                <option value="urgent">🚨 Urgent Notice</option>
                <option value="general">📢 General Announcement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description / Message *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write the details of the announcement that will scroll across the top bar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#004AAE] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition disabled:opacity-50"
            >
              <FiSend size={14} /> {submitting ? "Publishing..." : "Publish Broadcast"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
