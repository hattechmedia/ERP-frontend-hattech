import { motion } from "framer-motion";
import { FiX, FiAward } from "react-icons/fi";

export default function WinnerCelebrationModal({ winner, onClose }) {
  if (!winner) return null;

  const monthDisplay = winner.month || (winner.date ? new Date(winner.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Current Month');
  const awardTitle = winner.title || winner.awardType || 'Employee of the Month';
  const category = winner.awardType || 'Employee of the Month';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-gradient-to-b from-[#161a29] via-[#0f121d] to-[#0a0c14] border-2 border-slate-400/40 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-10"
        >
          <FiX size={18} />
        </button>

        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />

        {/* Crown Badge / Category */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-slate-300/20 to-amber-500/20 border border-slate-300/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-5 shadow-lg">
          <span className="text-sm">👑</span> {category}
        </div>

        {/* Winner Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-slate-400 via-white to-slate-500 shadow-[0_0_25px_rgba(203,213,225,0.6)]">
            <img
              src={winner.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(winner.name)}&backgroundColor=004AAE&textColor=ffffff`}
              alt={winner.name}
              className="w-full h-full rounded-full object-cover bg-gray-900 border-2 border-white"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-xl">
            🏆
          </div>
        </div>

        {/* Winner Name */}
        <h3 className="text-xl font-black text-white tracking-tight mb-1">
          {winner.name}
        </h3>
        {winner.department && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            {winner.department} {winner.position ? `• ${winner.position}` : ''}
          </p>
        )}

        {/* Award Details: Exact Title from Achievement */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-5 text-left space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
              <FiAward className="text-amber-400" /> Award Title:
            </span>
            <span className="text-xs font-black text-amber-300 text-right">{awardTitle}</span>
          </div>
          {winner.description && winner.description !== 'No description provided.' && (
            <p className="text-[11px] text-slate-300 italic border-t border-white/5 pt-2 leading-relaxed">
              "{winner.description}"
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
