import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ProjectCard } from "./ProjectCard";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, lockDnd, unlockDnd } from "../../../store/slices/dndSlice";

type Props = {
    assignedUserId: string;
    isCompleted: boolean;
    title: string;
    showToast: ShowToast;
};

export function ProjectColumn({ assignedUserId, isCompleted, title, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { draggingProjectId, locked } = useAppSelector((s) => s.dnd);

    const [offset, setOffset] = useState(0);

    const args = useMemo(() => {
        if (!assignedUserId) return skipToken;
        return { assignedUserId, isCompleted, offset, limit: PAGE_SIZE };
    }, [assignedUserId, isCompleted, offset]);

    const { data, isFetching, isLoading, isError, refetch } = useListProjectsQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!canLoadMore) return;
        const el = sentinelRef.current;
        const container = scrollContainerRef.current;
        if (!el || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (nextOffset == null) return;
                setOffset(nextOffset);
            },
            { root: container, rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [canLoadMore, nextOffset]);

    const [updateProject] = useUpdateProjectMutation();

    const onDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            if (locked) return;

            const payload = e.dataTransfer.getData("application/json");
            if (!payload) return;

            let dragged: Project;
            try {
                dragged = JSON.parse(payload) as Project;
            } catch {
                return;
            }

            if (dragged.id !== draggingProjectId) return;
            if (dragged.is_completed === isCompleted) return;

            dispatch(lockDnd(dragged.id));
            try {
                await updateProject({
                    id: dragged.id,
                    patch: { is_completed: isCompleted },
                    optimisticProject: dragged,
                }).unwrap();
                showToast(
                    "success",
                    isCompleted ? "Marked as completed." : "Moved back to in progress."
                );
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Failed to update project";
                showToast("error", message);
            } finally {
                dispatch(unlockDnd());
                dispatch(endDrag());
            }
        },
        [dispatch, draggingProjectId, isCompleted, locked, showToast, updateProject]
    );

    return (
        <section
            onDragOver={(e) => {
                if (!locked) e.preventDefault();
            }}
            onDrop={onDrop}
            className="flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 overflow-hidden"
        >
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xs font-semibold text-slate-700">{title}</h2>
                <p className="text-xs text-slate-500">{items.length}</p>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
                    ))}
                </div>
            ) : null}

            {isError ? (
                <EmptyState
                    title="Couldn't load projects"
                    description="Please check your connection and retry."
                    action={
                        <button
                            onClick={() => refetch()}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Retry
                        </button>
                    }
                />
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <EmptyState
                    title="No projects"
                    description={isCompleted ? "Drop a project here when you're done." : "You're all caught up."}
                />
            ) : null}

            <div ref={scrollContainerRef} className="min-h-0 flex-1 flex flex-col gap-2 overflow-y-auto">
                {items.map((p) => (
                    <ProjectCard key={p.id} project={p} disabled={locked} showToast={showToast} />
                ))}
                <div ref={sentinelRef} />
            </div>

            {isFetching && !isLoading ? (
                <div className="space-y-2 shrink-0">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
