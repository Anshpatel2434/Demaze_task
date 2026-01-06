import { useState, useMemo } from "react";
import type { Project } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { startDrag, endDrag } from "../../../store/slices/dndSlice";

type Props = {
    project: Project;
    disabled: boolean;
    onEdit: () => void;
    onToggleComplete: () => void;
};

export function UserProjectCard({ project, disabled, onEdit, onToggleComplete }: Props) {
    const dispatch = useAppDispatch();
    const { locked, updatingProjectId } = useAppSelector((s) => s.dnd);
    const [isHovered, setIsHovered] = useState(false);

    const isUpdating = updatingProjectId === project.id;
    const isDisabled = disabled || locked || isUpdating;

    const statusColor = useMemo(() => {
        return project.is_completed ? "border-green-500" : "border-yellow-500";
    }, [project.is_completed]);

    return (
        <div
            draggable={!isDisabled}
            onDragStart={(e) => {
                dispatch(startDrag(project.id));
                e.dataTransfer.setData("application/json", JSON.stringify(project));
                e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => dispatch(endDrag())}
            onClick={() => {
                if (!isDisabled) {
                    onEdit();
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                isDisabled ? "cursor-not-allowed opacity-60" : "hover:border-gray-300"
            } ${statusColor} border-l-4`}
        >
            {isUpdating ? (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/70 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500" />
                        Updating…
                    </div>
                </div>
            ) : null}

            <div className="flex items-center justify-between">
                <h3 className="truncate text-base font-medium text-gray-900">{project.title}</h3>
                
                {isHovered && !isDisabled ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete();
                        }}
                        className={`ml-2 rounded-full px-2 py-1 text-xs font-medium transition ${
                            project.is_completed
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                    >
                        {project.is_completed ? "Reopen" : "Complete"}
                    </button>
                ) : null}
            </div>

            {project.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{project.description}</p>
            ) : null}

            <div className="mt-2 flex items-center text-xs text-gray-500">
                <span>{project.is_completed ? "Completed" : "In Progress"}</span>
                {!isDisabled ? <span className="ml-auto">Click to edit</span> : null}
            </div>
        </div>
    );
}