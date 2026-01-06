import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}>;

export function TopBar({ title, subtitle, actions }: Props) {
    return (
        <header className="flex flex-col gap-3 rounded-xl border border-slate-900 bg-slate-950 px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <h1 className="text-base font-semibold tracking-tight text-white">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
    );
}
