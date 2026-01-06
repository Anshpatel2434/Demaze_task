import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectSchema } from "../../types";
import type { Project } from "../../types";
import { useUpdateProjectMutation } from "../../services/appApi";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import type { ShowToast } from "../../App";
import { Modal } from "./Modal";

const EditableSchema = ProjectSchema.pick({
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    showToast: ShowToast;
};

export function EditProjectModal({ isOpen, onClose, project, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    
    useEffect(() => {
        if (project) {
            setTitle(project.title);
            setDescription(project.description ?? "");
        }
    }, [project]);

    const normalizedDescription = useMemo(() => {
        const trimmed = description.trim();
        return trimmed.length === 0 ? null : trimmed;
    }, [description]);

    const validation = useMemo(() => {
        return EditableSchema.safeParse({ title: title.trim(), description: normalizedDescription });
    }, [normalizedDescription, title]);

    const [updateProject, { isLoading: isSaving }] = useUpdateProjectMutation();

    const save = async () => {
        if (!project || !validation.success) return;
        
        try {
            await updateProject({
                id: project.id,
                patch: { title: validation.data.title, description: validation.data.description },
            }).unwrap();
            showToast("success", "Project updated successfully");
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to save project";
            showToast("error", message);
        }
    };

    const showInvalid = !validation.success && (title.length > 0 || description.length > 0);

    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
            <div className="space-y-4">
                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSaving}
                    required
                />
                <Textarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                />

                <div className="flex items-center justify-between text-sm">
                    <span className={showInvalid ? "text-red-600" : "text-gray-500"}>
                        {showInvalid ? "Title cannot be empty" : ""}
                    </span>
                    {project.created_by_admin ? (
                        <span className="text-xs text-gray-400"> Assigned by admin </span>
                    ) : null}
                </div>

                <div className="flex justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!validation.success || isSaving}
                        onClick={save}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}