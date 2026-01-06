import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	helpText?: string;
};

export function Input({ label, helpText, className, id, ...props }: Props) {
	const inputId = id ?? props.name ?? undefined;
	return (
		<div className="space-y-1">
			{label ? (
				<label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
					{label}
				</label>
			) : null}
			<input
				id={inputId}
				{...props}
				className={`w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
			/>
			{helpText ? <p className="text-xs text-slate-400">{helpText}</p> : null}
		</div>
	);
}
