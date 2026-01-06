import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    description?: string;
    action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: Props) {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6 text-center">
            <p className="text-sm font-semibold text-slate-100">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    );
}
