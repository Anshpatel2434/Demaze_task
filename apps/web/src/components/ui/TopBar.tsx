import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = PropsWithChildren<{
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}>;

export function TopBar({ title, subtitle, actions }: Props) {
    return (
        <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"
                    >
                        <Sparkles className="h-4 w-4 text-white" />
                    </motion.div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
                </div>
                {subtitle ? (
                    <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-sm text-slate-600 ml-11"
                    >
                        {subtitle}
                    </motion.p>
                ) : null}
            </div>
            {actions ? (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    {actions}
                </motion.div>
            ) : null}
        </motion.header>
    );
}
