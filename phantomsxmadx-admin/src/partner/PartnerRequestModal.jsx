import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUploadCloud,
  FiFile,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiSend,
  FiAlertCircle,
  FiImage,
  FiPaperclip
} from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function PartnerRequestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "Prototype",
    serviceCategory: "WEB",
    priority: "Medium",
    budget: "",
    targetDeadline: "",
    description: "",
    requirements: ""
  });

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach(file => {
      // 10MB limit per file
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fileUrl = uploadEvent.target.result;
        let fileType = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.includes('pdf')) fileType = 'pdf';

        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            url: fileUrl,
            type: fileType,
            size: file.size,
            uploadedAt: new Date()
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a title for the proposal");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please provide a description or scope of work");
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const payload = {
        ...formData,
        attachments,
        partnerCompany: user.partnerCompanyName || user.name || "Partner Company",
        partnerCompanyId: user.partnerCompanyId || ""
      };

      const res = await api.post('/partner/requests', payload);
      if (res.data.success) {
        toast.success(res.data.message || "Proposal submitted to admin successfully!");
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to submit partner request:", err);
      toast.error(err.response?.data?.message || "Failed to submit proposal");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] text-white w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative my-8"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <FiX size={20} />
          </button>

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#004AAD]/20 text-[#004AAD] rounded-2xl border border-[#004AAD]/30">
              <FiUploadCloud size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Request New Prototype / Project
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Submit task specifications, designs, and brief documents for Admin review
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TITLE & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Proposal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Saloon Booking Prototype"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Category Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, serviceCategory: e.target.value })}
                >
                  <option value="Website Development">Website Development</option>
                  <option value="AI & Automation / Machine Learning">AI & Automation / Machine Learning</option>
                  <option value="SEO & Digital Marketing">SEO & Digital Marketing</option>
                  <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                  <option value="Prototype & MVP Design">Prototype & MVP Design</option>
                  <option value="New Feature / Task">New Feature / Task</option>
                  <option value="Other / Custom Request">Other / Custom Request</option>
                </select>
              </div>
            </div>

            {/* PRIORITY & DEADLINE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Priority
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent 🔥</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition cursor-pointer"
                  value={formData.targetDeadline}
                  onChange={(e) => setFormData({ ...formData, targetDeadline: e.target.value })}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Description & Scope of Work <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain the background, core problem to solve, and expected deliverables..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* REQUIREMENTS */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Technical Requirements & Features (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="List required tech stack, user flow, integrations, or special guidelines..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition resize-none"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            {/* ATTACHMENTS & DOCUMENT UPLOADS */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Attach Documents / Specifications (PDF, Images, Word Docs)
              </label>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.zip,.txt"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-[#004AAD] bg-white/5 hover:bg-[#004AAD]/5 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 rounded-full bg-white/10 group-hover:bg-[#004AAD]/20 text-gray-300 group-hover:text-[#004AAD] transition">
                  <FiPaperclip size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-[#004AAD] transition">
                    Click to browse files or drag & drop documents here
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Supports PDF, PNG, JPG, Word Docs, PPTX up to 10MB each
                  </p>
                </div>
              </div>

              {/* ATTACHMENTS PREVIEW LIST */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {file.type === 'image' ? (
                          <FiImage className="text-pink-400 shrink-0" size={16} />
                        ) : file.type === 'pdf' ? (
                          <FiFileText className="text-red-400 shrink-0" size={16} />
                        ) : (
                          <FiFile className="text-blue-400 shrink-0" size={16} />
                        )}
                        <span className="text-gray-200 font-medium truncate">{file.name}</span>
                        <span className="text-[10px] text-gray-400">({Math.round(file.size / 1024)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                        title="Remove file"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#004AAD] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSend size={14} />
                <span>{loading ? "Submitting..." : "Submit Proposal"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
