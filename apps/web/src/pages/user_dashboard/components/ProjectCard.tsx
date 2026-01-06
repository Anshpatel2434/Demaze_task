import { useState } from "react";
import type { Project } from "../../../types";
import type { ShowToast } from "../../../App";
import { EditProjectModal } from "../../../components/ui/EditProjectModal";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, startDrag } from "../../../store/slices/dndSlice";

type Props = {
    project: Project;
    disabled: boolean;
    showToast: ShowToast;
};

export function ProjectCard({ project, disabled, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { locked, updatingProjectId } = useAppSelector((s) => s.dnd);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const isDisabled = disabled || locked;
    const isUpdating = updatingProjectId === project.id;

    return (
        <>
            <div
                draggable={!isDisabled && !isUpdating}
                onDragStart={(e) => {
                    dispatch(startDrag(project.id));
                    e.dataTransfer.setData("application/json", JSON.stringify(project));
                    e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => dispatch(endDrag())}
                onClick={() => !isDisabled && !isUpdating && setIsModalOpen(true)}
                className={`group relative cursor-pointer rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-sm transition hover:border-indigo-400/40 hover:bg-slate-950/60 ${
                    isDisabled ? "opacity-70" : ""
                }`}
            >
                {isUpdating ? (
                    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-slate-950/70">
                        <div className="flex items-center gap-2 text-sm text-slate-100">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Updating…
                        </div>
                    </div>
                ) : null}

                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                            Title
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                            {project.title}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                            Description
                        </p>
                        <p className="text-sm text-slate-300 line-clamp-3">
                            {project.description ?? "—"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Click to edit • Drag to move</span>
                        {project.created_by_admin ? <span className="text-slate-500">Assigned</span> : null}
                    </div>
                </div>
            </div>

            <EditProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={project}
                showToast={showToast}
            />
        </>
    );
}
