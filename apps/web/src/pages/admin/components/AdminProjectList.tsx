import { useEffect, useMemo, useRef, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "../../../components/ui/Button";
import type { ShowToast } from "../../../App";

function findUserEmail(users: UserProfile[], id: string) {
    return users.find((u) => u.id === id)?.email ?? id.slice(0, 8);
}

type Props = {
    selectedUser: UserProfile | null;
    knownUsers: UserProfile[];
    showToast: ShowToast;
};

export function AdminProjectList({ selectedUser, knownUsers, showToast }: Props) {
    const [offset, setOffset] = useState(0);

    const args = useMemo(() => ({ offset, limit: PAGE_SIZE }), [offset]);
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

    const [updateProject, { isLoading: isAssigning }] = useUpdateProjectMutation();

    const assignTimerRef = useRef<number | null>(null);
    const pendingProjectRef = useRef<Project | null>(null);

    useEffect(() => {
        return () => {
            if (assignTimerRef.current) window.clearTimeout(assignTimerRef.current);
        };
    }, []);

    const assign = async (project: Project) => {
        if (!selectedUser) {
            showToast("info", "Select a user to assign.");
            return;
        }
        if (selectedUser.id === project.assigned_user_id) return;

        try {
            await updateProject({
                id: project.id,
                patch: { assigned_user_id: selectedUser.id },
                optimisticProject: project,
            }).unwrap();
            showToast("success", "Assignment updated.");
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to assign project";
            showToast("error", message);
        }
    };

    const onAssignClick = (project: Project) => {
        pendingProjectRef.current = project;

        if (assignTimerRef.current) window.clearTimeout(assignTimerRef.current);
        assignTimerRef.current = window.setTimeout(() => {
            const p = pendingProjectRef.current;
            pendingProjectRef.current = null;
            if (p) void assign(p);
        }, 250);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Projects</h2>
                <p className="text-xs text-slate-400">{items.length}</p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
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
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
                        >
                            Retry
                        </button>
                    }
                />
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <EmptyState title="No projects" description="Create a project to get started." />
            ) : null}

            <div className="space-y-3">
                {items.map((p) => (
                    <div
                        key={p.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-100">{p.title}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description ?? "—"}</p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                                    p.is_completed
                                        ? "bg-emerald-500/15 text-emerald-200"
                                        : "bg-amber-500/15 text-amber-200"
                                }`}
                            >
                                {p.is_completed ? "Completed" : "In progress"}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">
                                Assigned: <span className="text-slate-200">{findUserEmail(knownUsers, p.assigned_user_id)}</span>
                            </p>
                            <Button
                                variant="secondary"
                                disabled={!selectedUser || isAssigning}
                                onClick={() => onAssignClick(p)}
                            >
                                Assign to selected
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div ref={sentinelRef} />

            {isFetching && !isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
