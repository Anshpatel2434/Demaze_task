import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Project, UserProfile } from "../../types";
import { ProjectSchema } from "../../types";
import { useUpdateProjectMutation } from "../../services/appApi";
import type { ShowToast } from "../../App";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { User, Edit3, CheckCircle2, Circle, Save } from "lucide-react";

const EditableSchema = ProjectSchema.pick({
    title: true,
    description: true,
    assigned_user_id: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    users: UserProfile[];
    showToast: ShowToast;
};

export function EditProjectModal({ isOpen, onClose, project, users, showToast }: Props) {
    const [title, setTitle] = useState(() => project.title);
    const [description, setDescription] = useState(() => project.description ?? "");
    const [assignedUserId, setAssignedUserId] = useState<string | null>(project.assigned_user_id);

    const [updateProject, { isLoading }] = useUpdateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const trimmed = description.trim();
        return trimmed.length === 0 ? null : trimmed;
    }, [description]);

    const validation = useMemo(() => {
        return EditableSchema.safeParse({ title: title.trim(), description: normalizedDescription, assigned_user_id: assignedUserId });
    }, [normalizedDescription, title, assignedUserId]);

    const canSubmit = validation.success && (
        title.trim() !== project.title || 
        normalizedDescription !== project.description || 
        assignedUserId !== project.assigned_user_id
    );

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validation.success) {
            showToast("error", "Title cannot be empty");
            return;
        }

        try {
            await updateProject({
                id: project.id,
                patch: { 
                    title: validation.data.title, 
                    description: validation.data.description,
                    assigned_user_id: validation.data.assigned_user_id
                },
                optimisticProject: project,
            }).unwrap();
            showToast("success", "Project updated");
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to update project";
            showToast("error", message);
        }
    };

    const assignedUser = assignedUserId ? users.find(u => u.id === assignedUserId) : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" size="lg">
            <form onSubmit={onSubmit} className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Edit3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Edit Project</h3>
                        <p className="text-sm text-slate-600">Update project details and assignments</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Input
                        label="Project Title"
                        placeholder="Enter project title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Textarea
                        label="Description"
                        placeholder="Update project description (optional)..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        rows={3}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <User className="h-4 w-4" />
                        Assign to User (Optional)
                    </label>
                    <div className="relative">
                        <select
                            value={assignedUserId ?? ""}
                            onChange={(e) => setAssignedUserId(e.target.value || null)}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 transition-all"
                            disabled={isLoading}
                        >
                            <option value="">👤 Unassigned</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.email} {user.full_name ? `(${user.full_name})` : ""}
                                </option>
                            ))}
                        </select>
                        {assignedUser && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2 flex items-center gap-2 text-sm text-slate-600"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                                    <User className="h-3 w-3 text-blue-600" />
                                </div>
                                <span>Currently assigned to: <strong>{assignedUser.email}</strong></span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4"
                >
                    <h4 className="text-sm font-medium text-slate-800 mb-3">Project Status</h4>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                project.is_completed 
                                    ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                                    : "bg-gradient-to-br from-amber-500 to-orange-600"
                            }`}>
                                {project.is_completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                ) : (
                                    <Circle className="h-4 w-4 text-white" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {project.is_completed ? "Completed" : "In Progress"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {project.is_completed ? "Project is finished" : "Project is actively being worked on"}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                                project.is_completed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                        >
                            {project.is_completed ? "Done" : "Active"}
                        </span>
                    </div>
                    {project.created_by_admin && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                This project was assigned by an administrator
                            </p>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 pt-4 border-t border-slate-200"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                </motion.div>
            </form>
        </Modal>
    );
}
