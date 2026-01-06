import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}>;

export function TopBar({ title, subtitle, actions }: Props) {
    return (
        <header className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h1>
                {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
    );
}
