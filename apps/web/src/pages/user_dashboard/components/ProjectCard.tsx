import { useAppSelector } from "../../../store/hooks";
import type { Project } from "../../../types";

type Props = {
    project: Project;
    disabled: boolean;
    onEdit: (project: Project) => void;
};

export function ProjectCard({ project, disabled, onEdit }: Props) {
    const { locked } = useAppSelector((s) => s.dnd);

    const isDisabled = disabled || locked;

    return (
        <div
            draggable={!isDisabled}
            onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(project));
                e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => !isDisabled && onEdit(project)}
            className={`group relative rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer ${
                isDisabled ? "opacity-60" : "hover:border-blue-400"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{project.title}</p>
                    {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
                    )}
                </div>
                <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        project.is_completed
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                >
                    {project.is_completed ? "Completed" : "In Progress"}
                </span>
            </div>

            {project.created_by_admin && (
                <div className="mt-2">
                    <span className="text-xs text-blue-600 font-medium">Assigned by admin</span>
                </div>
            )}
        </div>
    );
}
