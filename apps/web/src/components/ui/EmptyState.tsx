import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import { Inbox, AlertCircle } from "lucide-react";

type Props = PropsWithChildren<{
    title: string;
    description?: string;
    action?: ReactNode;
    variant?: "default" | "error";
}>;

export function EmptyState({ title, description, action, variant = "default" }: Props) {
    const Icon = variant === "error" ? AlertCircle : Inbox;
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 text-center shadow-sm"
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-4"
            >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    variant === "error" 
                        ? "bg-gradient-to-br from-rose-100 to-pink-100" 
                        : "bg-gradient-to-br from-indigo-100 to-purple-100"
                }`}>
                    <Icon className={`h-6 w-6 ${
                        variant === "error" ? "text-rose-600" : "text-indigo-600"
                    }`} />
                </div>
            </motion.div>
            
            <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-semibold text-slate-900 mb-2"
            >
                {title}
            </motion.h3>
            
            {description ? (
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-slate-600 mb-6 leading-relaxed"
                >
                    {description}
                </motion.p>
            ) : null}
            
            {action ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex justify-center"
                >
                    {action}
                </motion.div>
            ) : null}
        </motion.div>
    );
}
