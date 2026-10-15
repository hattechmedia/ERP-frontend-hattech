import { motion } from "framer-motion";

export default function StatCard({ title, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="rounded-xl p-6 border-theme bg-theme-card"
    >
      <p className="text-sm text-theme-secondary">{title}</p>
      <h3 className="text-3xl font-bold text-primary">
        {value}
      </h3>
    </motion.div>
  );
}
