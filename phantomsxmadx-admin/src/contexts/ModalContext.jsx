import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';

const ModalContext = createContext();

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const confirm = useCallback((config) => {
        return new Promise((resolve) => {
            setModalConfig({
                title: 'Confirm Action',
                message: 'Are you sure you want to proceed?',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                type: 'warning', // warning, info, danger, success
                ...config,
                resolve
            });
        });
    }, []);

    const close = useCallback((result) => {
        if (modalConfig?.resolve) {
            modalConfig.resolve(result);
        }
        setModalConfig(null);
    }, [modalConfig]);

    const getIcon = (type) => {
        switch (type) {
            case 'danger':
            case 'warning':
                return <FiAlertTriangle className="text-orange-500" size={32} />;
            case 'success':
                return <FiCheckCircle className="text-emerald-500" size={32} />;
            case 'info':
            default:
                return <FiInfo className="text-blue-500" size={32} />;
        }
    };

    const getButtonClass = (type) => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20';
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20';
            case 'warning':
                return 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20';
            case 'info':
            default:
                return 'bg-[#004AAE] hover:bg-[#003882] text-white shadow-blue-500/20';
        }
    };

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {modalConfig && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Accent Line */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${modalConfig.type === 'danger' ? 'bg-red-500' :
                                    modalConfig.type === 'success' ? 'bg-emerald-500' :
                                        modalConfig.type === 'warning' ? 'bg-orange-500' : 'bg-[#004AAE]'
                                }`}></div>

                            <div className="text-center space-y-6">
                                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${modalConfig.type === 'danger' ? 'bg-red-50' :
                                        modalConfig.type === 'success' ? 'bg-emerald-50' :
                                            modalConfig.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'
                                    }`}>
                                    {getIcon(modalConfig.type)}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                        {modalConfig.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed px-2">
                                        {modalConfig.message}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => close(false)}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                                    >
                                        {modalConfig.cancelText}
                                    </button>
                                    <button
                                        onClick={() => close(true)}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${getButtonClass(modalConfig.type)}`}
                                    >
                                        {modalConfig.confirmText}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => close(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <FiX size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ModalContext.Provider>
    );
};
