import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
    if (!isOpen) return null;

    const accentColor = type === "danger" ? "bg-red-500" : "bg-blue-600";
    const shadowColor = type === "danger" ? "shadow-red-500/20" : "shadow-blue-600/20";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-[#0A0F1C] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
                    >
                        {/* Header Image/Icon Section */}
                        <div className={`h-32 ${accentColor} flex items-center justify-center relative`}>
                            <div className="absolute top-4 right-4">
                                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                                    <FiX size={20} />
                                </button>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl"
                            >
                                <FiAlertTriangle size={32} className={type === "danger" ? "text-red-500" : "text-blue-600"} />
                            </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-black text-[#0A0F1C] dark:text-white uppercase tracking-tighter mb-2">
                                {title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                                {message}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => { onConfirm(); onClose(); }}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white ${accentColor} ${shadowColor} shadow-lg hover:brightness-110 transition-all active:scale-95`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
