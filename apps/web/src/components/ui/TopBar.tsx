import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}>;

export function TopBar({ title, subtitle, actions }: Props) {
    return (
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
    );
}
