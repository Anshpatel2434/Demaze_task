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
                className={`group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 ${
                    isDisabled ? "opacity-70" : ""
                }`}
            >
                {isUpdating ? (
                    <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/70">
                        <div className="flex items-center gap-2 text-sm text-slate-900">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
                            Updating…
                        </div>
                    </div>
                ) : null}

                <div className="space-y-2">
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Title
                        </p>
                        <p className="text-sm font-medium text-slate-900">{project.title}</p>
                    </div>

                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Description
                        </p>
                        <p className="line-clamp-2 text-sm text-slate-700">{project.description ?? "—"}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Click to edit • Drag to move</span>
                        {project.created_by_admin ? <span className="text-slate-400">Assigned</span> : null}
                    </div>
                </div>
            </div>

            <EditProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={project}
                users={[]}
                showToast={showToast}
            />
        </>
    );
}
