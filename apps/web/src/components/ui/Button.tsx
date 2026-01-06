import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
	primary:
		"bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-400 disabled:bg-indigo-700/60",
	secondary:
		"bg-slate-700/40 text-slate-100 hover:bg-slate-700/60 focus:ring-slate-400 disabled:bg-slate-700/30",
	ghost:
		"bg-transparent text-slate-100 hover:bg-white/5 focus:ring-white/30 disabled:text-slate-400",
	danger:
		"bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-400 disabled:bg-rose-700/60",
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
					<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
					<span>Working…</span>
				</span>
			) : (
				children
			)}
		</button>
	);
}
