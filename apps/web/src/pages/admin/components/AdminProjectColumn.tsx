import { useEffect, useMemo, useRef, useState } from "react";
import type { UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { AdminProjectCard } from "./AdminProjectCard";
import type { ShowToast } from "../../../App";

type Props = {
    selectedUser: UserProfile | null;
    knownUsers: UserProfile[];
    showToast: ShowToast;
    isCompleted: boolean;
    title: string;
};

export function AdminProjectColumn({ selectedUser, knownUsers, showToast, isCompleted, title }: Props) {
    const [offset, setOffset] = useState(0);

    const args = useMemo(() => ({ isCompleted, offset, limit: PAGE_SIZE }), [isCompleted, offset]);
    const { data, isLoading, isFetching, isError, refetch } = useListProjectsQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!canLoadMore) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (nextOffset == null) return;
                setOffset(nextOffset);
            },
            { root: null, rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [canLoadMore, nextOffset]);

    return (
        <div className="flex h-[calc(100vh-200px)] min-w-0 flex-col rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {items.length}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                ) : null}

                {isError ? (
                    <EmptyState
                        title="Couldn't load projects"
                        description="Please retry."
                        action={
                            <button
                                onClick={() => refetch()}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Retry
                            </button>
                        }
                    />
                ) : null}

                {!isLoading && !isError && items.length === 0 ? (
                    <EmptyState
                        title={`No ${title.toLowerCase()} projects`}
                        description="Create or assign projects to see them here."
                    />
                ) : null}

                <div className="space-y-3">
                    {items.map((p) => (
                        <AdminProjectCard
                            key={p.id}
                            project={p}
                            knownUsers={knownUsers}
                            selectedUser={selectedUser}
                            showToast={showToast}
                            allowDragAssign={!isCompleted}
                        />
                    ))}
                </div>

                <div ref={sentinelRef} />

                {isFetching && !isLoading ? (
                    <div className="mt-3 space-y-3">
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}