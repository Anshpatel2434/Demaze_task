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
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            ) : null}
            <input
                id={inputId}
                {...props}
                className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${className ?? ""}`}
            />
            {helpText ? <p className="text-xs text-slate-500">{helpText}</p> : null}
        </div>
    );
}
