import type { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
    title: string;
    description?: string;
    action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: Props) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm font-semibold text-gray-700">{title}</p>
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    );
}
