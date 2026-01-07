import { motion } from "framer-motion";

type Props = {
    className?: string;
};

export function Skeleton({ className }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse" as const
            }}
            className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 ${className ?? ""}`}
        />
    );
}
