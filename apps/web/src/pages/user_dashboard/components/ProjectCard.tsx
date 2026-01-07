import { useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "../../../types";
import type { ShowToast } from "../../../App";
import { EditProjectModal } from "../../../components/ui/EditProjectModal";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, startDrag } from "../../../store/slices/dndSlice";
import { Folder, Clock, Edit3, Move, User } from "lucide-react";

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
            >
                <motion.div
                    whileHover={!isDisabled ? { y: -4, transition: { duration: 0.2 } } : {}}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`group relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-lg ${
                        isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                    }`}
                >
                {isUpdating ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/80 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Clock className="h-5 w-5 text-indigo-600" />
                            </motion.div>
                            <span className="text-sm font-medium text-slate-900">Updating...</span>
                        </div>
                    </motion.div>
                ) : null}

                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                                <Folder className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                                {project.is_completed ? (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"
                                    >
                                        Done
                                    </motion.span>
                                ) : (
                                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 className="h-3 w-3 text-slate-400" />
                            <Move className="h-3 w-3 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-slate-900 mb-2 leading-tight">
                            {project.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {project.description || "No description provided"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Edit3 className="h-3 w-3" />
                                <span>Click to edit</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Move className="h-3 w-3" />
                                <span>Drag to move</span>
                            </div>
                        </div>
                        {project.created_by_admin && (
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-400">Assigned</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
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
