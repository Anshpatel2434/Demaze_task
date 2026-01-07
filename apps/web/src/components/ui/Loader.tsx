import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loader({ size = "md", text = "Loading...", className = "" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <Loader2 className={`${sizeClasses[size]} text-indigo-600`} />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Loader2 className={`${sizeClasses[size]} text-indigo-300`} />
        </motion.div>
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium text-slate-600"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-4 h-4 text-indigo-600" />
      </motion.div>
    </motion.div>
  );
}