import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    description?: string;
    action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    );
}
