import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    title?: string;
    className?: string;
}>;

export function Card({ title, className, children }: Props) {
    return (
        <section
            className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ${className ?? ""}`}
        >
            {title ? <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2> : null}
            {children}
        </section>
    );
}
