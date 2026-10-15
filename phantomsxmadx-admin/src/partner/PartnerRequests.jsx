import { useState, useEffect } from "react";
import {
  FiFileText,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiExternalLink,
  FiPaperclip,
  FiFolder,
  FiLayers,
  FiImage,
  FiTrash2
} from "react-icons/fi";
import api from "../services/api";
import PartnerRequestModal from "./PartnerRequestModal";
import { toast } from "react-hot-toast";

export default function PartnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/partner/requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load partner requests:", err);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (reqId) => {
    if (!window.confirm("Are you sure you want to delete this proposal request?")) return;
    try {
      const res = await api.delete(`/partner/requests/${reqId}`);
      if (res.data.success) {
        toast.success("Proposal deleted successfully");
        setRequests(prev => prev.filter(r => r._id !== reqId));
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
      toast.error(err.response?.data?.message || "Failed to delete proposal");
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === "pending") return r.status === "Pending";
    if (activeTab === "approved") return r.status === "Approved" || r.status === "Acknowledged";
    if (activeTab === "rejected") return r.status === "Rejected";
    return true;
  });

  return (
    <div className="space-y-6 pt-12 md:pt-0 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiLayers className="text-[#004AAD]" /> Project & Prototype Proposals
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Submit specifications, prototypes, and track Admin acknowledgments & conversion to live projects
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#004AAD] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 transition cursor-pointer"
        >
          <FiPlus size={16} />
          <span>New Proposal Request</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Proposals", count: requests.length },
          { id: "pending", label: "Pending Review", count: requests.filter(r => r.status === "Pending").length },
          { id: "approved", label: "Acknowledged & Converted", count: requests.filter(r => r.status === "Approved" || r.status === "Acknowledged").length },
          { id: "rejected", label: "Declined", count: requests.filter(r => r.status === "Rejected").length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#004AAD] text-white shadow-md shadow-blue-900/30"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* REQUESTS LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-[#004AAD] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400">Loading proposal requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl space-y-3">
          <FiFileText size={40} className="mx-auto text-gray-500 opacity-40" />
          <p className="text-sm font-bold text-gray-300">No proposal requests in this category</p>
          <p className="text-xs text-gray-500">Click &quot;New Proposal Request&quot; to request a prototype or project collaboration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#004AAD]/50 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">
                      {req.type}
                    </span>
                    <h3 className="text-lg font-black text-white mt-1.5 line-clamp-1">{req.title}</h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      req.status === "Approved" || req.status === "Acknowledged"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : req.status === "Rejected"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {req.description}
                </p>

                {req.requirements && (
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-[11px] text-gray-400 space-y-1">
                    <span className="font-bold text-gray-300 block uppercase tracking-wider text-[10px]">Specifications:</span>
                    <p className="line-clamp-2">{req.requirements}</p>
                  </div>
                )}

                {/* ATTACHMENTS */}
                {req.attachments && req.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <FiPaperclip size={11} /> {req.attachments.length} Attached Document(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {req.attachments.map((file, fIdx) => (
                        <a
                          key={fIdx}
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[11px] text-blue-400 hover:text-blue-300 transition"
                        >
                          {file.type === 'image' ? <FiImage size={12} /> : <FiFileText size={12} />}
                          <span className="truncate max-w-[140px]">{file.name}</span>
                          <FiDownload size={11} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                
                <div className="flex items-center gap-2">
                  {req.convertedProjectId && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <FiCheckCircle size={12} /> Live in Projects
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteRequest(req._id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition cursor-pointer flex items-center gap-1"
                    title="Delete Proposal"
                  >
                    <FiTrash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REQUEST MODAL */}
      <PartnerRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => fetchRequests()}
      />
    </div>
  );
}
