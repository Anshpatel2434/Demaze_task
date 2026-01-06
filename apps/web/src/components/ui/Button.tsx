import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 disabled:bg-blue-300",
    secondary:
        "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400 disabled:bg-gray-100",
    ghost:
        "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 disabled:text-gray-400",
    danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 disabled:bg-red-300",
};

export function Button({
    variant = "primary",
    isLoading,
    className,
    disabled,
    children,
    ...props
}: Props) {
    return (
        <button
            {...props}
            disabled={disabled || isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${className ?? ""}`}
        >
            {isLoading ? (
                <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
                    <span>Working…</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
}
