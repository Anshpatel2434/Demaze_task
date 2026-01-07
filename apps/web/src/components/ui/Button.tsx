import type { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    isLoading?: boolean;
    size?: "sm" | "md" | "lg";
};

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 focus:ring-indigo-400 shadow-lg hover:shadow-xl disabled:from-indigo-300 disabled:to-purple-300",
    secondary:
        "border-2 border-slate-200 bg-gradient-to-r from-white to-slate-50 text-slate-700 hover:from-slate-50 hover:to-slate-100 hover:border-slate-300 focus:ring-indigo-400 disabled:from-slate-50 disabled:to-slate-100 shadow-sm hover:shadow-md",
    ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-indigo-400 disabled:text-slate-400",
    danger:
        "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-500 hover:to-pink-500 focus:ring-rose-400 shadow-lg hover:shadow-xl disabled:from-rose-300 disabled:to-pink-300",
    success:
        "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 focus:ring-emerald-400 shadow-lg hover:shadow-xl disabled:from-emerald-300 disabled:to-green-300",
};

const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
};

export function Button({
    variant = "primary",
    isLoading,
    size = "md",
    className,
    disabled,
    children,
    ...props
}: Props) {
    return (
        <motion.button
            whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
            transition={{ duration: 0.15 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(props as any)}
            disabled={disabled || isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
        >
            {isLoading ? (
                <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-flex items-center gap-2"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="h-4 w-4" />
                    </motion.div>
                    <span>Working...</span>
                </motion.span>
            ) : (
                <span>{children}</span>
            )}
        </motion.button>
    );
}
