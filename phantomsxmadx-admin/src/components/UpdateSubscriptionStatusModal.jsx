import { useState, useEffect } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiType, FiImage, FiSend, FiZap } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function UpdateSubscriptionStatusModal({ isOpen, onClose, onSave, project, isLight }) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState("");
    const [images, setImages] = useState([]); // Array of DataURIs or existing URLs
    const [previews, setPreviews] = useState([]); // Visual previews
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        // Reset form for fresh daily report
        setSummary("");
        setImages([]);
        setPreviews([]);
    }, [project]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result]);
                    setPreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!summary.trim()) {
            toast.error("Please provide a performance summary.");
            return;
        }

        try {
            setLoading(true);
            toast.loading("Updating subscription report...", { id: 'update' });
            
            const payload = {
                subscriptionSummary: summary,
                subscriptionSummaryImages: images, // Send the full list (new and existing)
            };

            const res = await api.put(`/projects/${project._id}`, payload);

            if (res.data.success) {
                toast.success("Subscription report updated!", { id: 'update' });
                onSave();
                onClose();
            }
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update status", { id: 'update' });
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
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[110] backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl border transition-all duration-300 custom-scrollbar ${
                            isLight ? 'bg-white border-gray-100' : 'bg-[#151235] border-[#312e81]'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                    <FiZap size={20} />
                                </div>
                                <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Update Performance Summary</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/5 p-2 rounded-full">
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            {/* PROJECT INFO PREVIEW */}
                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/10'}`}>
                                <p className="text-[10px] font-bold text-[#004AAD] uppercase tracking-widest mb-1">Project</p>
                                <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{project?.title}</p>
                                <p className="text-xs text-gray-400">{project?.client?.companyName || 'Private Client'}</p>
                            </div>

                            {/* SUMMARY TEXT */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                                    <FiType className="text-blue-500" /> Performance Text Summary
                                </label>
                                <textarea
                                    className={`w-full p-4 rounded-2xl border focus:ring-2 focus:ring-[#004AAD] outline-none transition-all min-h-[120px] text-sm leading-relaxed ${
                                        isLight ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-[#0f0b1f] border-gray-700 text-white'
                                    }`}
                                    value={summary}
                                    onChange={e => setSummary(e.target.value)}
                                    placeholder="Briefly describe this month's successes, tasks completed, or key metrics..."
                                    required
                                />
                            </div>

                            {/* MULTI-IMAGE UPLOAD GALLERY */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                                    <FiImage className="text-purple-500" /> Attachment Gallery / Results Images
                                </label>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                    {previews.map((src, index) => (
                                        <div key={index} className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-700 overflow-hidden bg-black/20">
                                            <img src={src} className="w-full h-full object-cover cursor-pointer" alt={`Preview ${index}`} onClick={() => setLightboxImage(src)} />
                                            <button 
                                                type="button" 
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 active:scale-95"
                                            >
                                                <FiX size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-700 overflow-hidden flex flex-col items-center justify-center bg-black/20 hover:border-[#004AAD] transition-colors cursor-pointer">
                                        <FiImage className="text-gray-600 group-hover:text-[#004AAD] transition-colors mb-2" size={24} />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase">Add More</span>
                                        <input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>
                                <p className={`text-[10px] mt-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                    You can select multiple screenshots or graphics to report performance results.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 bg-gradient-to-br from-[#004AAD] to-blue-600 !text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                            >
                                <FiSend />
                                {loading ? "Updating Client Dashboard..." : "Post Update to Client Panel"}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            {/* INTERNAL LIGHTBOX */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-8 backdrop-blur-xl"
                    onClick={() => setLightboxImage(null)}
                >
                    <button className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20">
                        <FiX size={32} />
                    </button>
                    <img src={lightboxImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" alt="Report Preview" />
                </div>
            )}
        </AnimatePresence>
    );
}
