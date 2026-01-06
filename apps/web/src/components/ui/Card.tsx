import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
	title?: string;
	className?: string;
}>;

export function Card({ title, className, children }: Props) {
	return (
		<section
			className={`rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-sm backdrop-blur ${className ?? ""}`}
		>
			{title ? <h2 className="mb-3 text-sm font-semibold text-slate-100">{title}</h2> : null}
			{children}
		</section>
	);
}
