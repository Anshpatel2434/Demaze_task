import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Loader } from "../../../components/ui/Loader";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ProjectCard } from "./ProjectCard";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, lockDnd, unlockDnd } from "../../../store/slices/dndSlice";
import { CheckCircle2, Circle } from "lucide-react";

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
    const items = useMemo(() => data?.items ?? [], [data]);
    useEffect(() => {
        if(data){
            console.log("The items in the completed section is : ")
            console.log(items)
        }
    }, [data, items])
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
            { root: container }
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
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onDragOver={(e) => {
                if (!locked) e.preventDefault();
            }}
            onDrop={onDrop}
            className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 overflow-hidden shadow-sm"
        >
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between shrink-0"
            >
                <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        isCompleted 
                            ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                            : "bg-gradient-to-br from-amber-500 to-orange-600"
                    }`}>
                        {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                        ) : (
                            <Circle className="h-3 w-3 text-white" />
                        )}
                    </div>
                    <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                </div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-sm border border-slate-200"
                >
                    <span className="text-xs font-medium text-slate-600">{items.length}</span>
                </motion.div>
            </motion.div>

            {isLoading ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
                    ))}
                </motion.div>
            ) : null}

            {isError ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <EmptyState
                        title="Couldn't load projects"
                        description="Please check your connection and retry."
                        variant="error"
                        action={
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => refetch()}
                                className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:from-slate-50 hover:to-slate-100"
                            >
                                Retry
                            </motion.button>
                        }
                    />
                </motion.div>
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <EmptyState
                        title="No projects"
                        description={isCompleted ? "Drop a project here when you're done." : "You're all caught up."}
                    />
                </motion.div>
            ) : null}

            <div ref={scrollContainerRef} className="min-h-0 flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    {items.map((p, index) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <ProjectCard project={p} disabled={locked} showToast={showToast} />
                        </motion.div>
                    ))}
                </motion.div>
                <div ref={sentinelRef} />
            </div>

            {isFetching && !isLoading ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center py-4 shrink-0"
                >
                    <Loader size="sm" text="" />
                </motion.div>
            ) : null}
        </motion.section>
    );
}
