import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, lockDnd, unlockDnd } from "../../../store/slices/dndSlice";
import { UserProjectCard } from "./UserProjectCard";
import { EditProjectModal } from "../../../components/ui/EditProjectModal";

type Props = {
    assignedUserId: string;
    isCompleted: boolean;
    title: string;
    showToast: ShowToast;
};

export function UserProjectColumn({ assignedUserId, isCompleted, title, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { draggingProjectId, locked } = useAppSelector((s) => s.dnd);

    const [offset, setOffset] = useState(0);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const args = useMemo(() => {
        if (!assignedUserId) return skipToken;
        return { assignedUserId, isCompleted, offset, limit: PAGE_SIZE };
    }, [assignedUserId, isCompleted, offset]);

    const { data, isFetching, isLoading, isError, refetch } = useListProjectsQuery(args);
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

    const [updateProject] = useUpdateProjectMutation();

    const toggleComplete = useCallback(async (projectId: string) => {
        dispatch(lockDnd(projectId));
        try {
            await updateProject({
                id: projectId,
                patch: { is_completed: !isCompleted },
            }).unwrap();
            showToast(
                "success",
                !isCompleted ? "Marked as completed." : "Moved back to in progress."
            );
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to update project";
            showToast("error", message);
        } finally {
            dispatch(unlockDnd());
        }
    }, [dispatch, isCompleted, showToast, updateProject]);

    return (
        <div className="flex h-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {items.length}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-20 w-full rounded-lg" />
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
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

                <div className="space-y-3">
                    {items.map((p) => (
                        <UserProjectCard 
                            key={p.id} 
                            project={p} 
                            disabled={locked}
                            onEdit={() => setEditingProject(p)}
                            onToggleComplete={() => toggleComplete(p.id)}
                        />
                    ))}
                </div>

                <div ref={sentinelRef} />

                {isFetching && !isLoading ? (
                    <div className="mt-3 space-y-3">
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                ) : null}
            </div>

            <EditProjectModal 
                isOpen={editingProject !== null}
                onClose={() => setEditingProject(null)}
                project={editingProject}
                showToast={showToast}
            />
        </div>
    );
}