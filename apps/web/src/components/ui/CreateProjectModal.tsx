import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProjectSchema } from "../../types";
import type { UserProfile } from "../../types";
import { useCreateProjectMutation } from "../../services/appApi";
import type { ShowToast } from "../../App";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { User, Folder, Plus } from "lucide-react";

const CreateSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    users: UserProfile[];
    showToast: ShowToast;
};

export function CreateProjectModal({ isOpen, onClose, users, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [createProject, { isLoading }] = useCreateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const t = description.trim();
        return t.length === 0 ? null : t;
    }, [description]);

    const canSubmit = title.trim().length > 0;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsed = CreateSchema.safeParse({
            assigned_user_id: selectedUserId,
            title: title.trim(),
            description: normalizedDescription,
        });

        if (!parsed.success) {
            const message = parsed.error.issues.map((i) => i.message).join("\n");
            showToast("error", message);
            return;
        }

        try {
            await createProject(parsed.data).unwrap();
            showToast("success", "Project created.");
            setTitle("");
            setDescription("");
            setSelectedUserId(null);
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to create project";
            showToast("error", message);
        }
    };

    const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
            <form onSubmit={onSubmit} className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Folder className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">New Project</h3>
                        <p className="text-sm text-slate-600">Create a fresh project to get started</p>
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
                        placeholder="Add a description for your project (optional)..."
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
                            value={selectedUserId ?? ""}
                            onChange={(e) => setSelectedUserId(e.target.value || null)}
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
                        {selectedUser && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2 flex items-center gap-2 text-sm text-slate-600"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                                    <User className="h-3 w-3 text-indigo-600" />
                                </div>
                                <span>Assigned to: <strong>{selectedUser.email}</strong></span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
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
                        variant="success"
                        className="flex-1"
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    >
                        <Plus className="h-4 w-4" />
                        Create Project
                    </Button>
                </motion.div>
            </form>
        </Modal>
    );
}
