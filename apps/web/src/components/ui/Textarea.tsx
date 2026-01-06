import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    helpText?: string;
};

export function Textarea({ label, helpText, className, id, ...props }: Props) {
    const inputId = id ?? props.name ?? undefined;
    return (
        <div className="space-y-1">
            {label ? (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            ) : null}
            <textarea
                id={inputId}
                {...props}
                className={`min-h-[96px] w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
            />
            {helpText ? <p className="text-xs text-gray-500">{helpText}</p> : null}
        </div>
    );
}
