import { useState } from "react";
import type { Project } from "../../../types";
import { useBootstrapAuthQuery, useSignOutMutation } from "../../../services/appApi";
import type { ShowToast } from "../../../App";
import { ProjectColumn } from "../components/ProjectColumn";
import { EditProjectModal } from "../components/EditProjectModal";

type Props = {
    showToast: ShowToast;
};

const UserDashboard = ({ showToast }: Props) => {
    const { data } = useBootstrapAuthQuery();
    const userId = data?.userId ?? null;

    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const handleSignOut = async () => {
        try {
            await signOut().unwrap();
            showToast("info", "Signed out.");
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Couldn't sign out";
            showToast("error", message);
        }
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProject(null);
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Your Dashboard</h1>
                    <p className="text-sm text-gray-500">Drag projects to change status, click to edit</p>
                </div>
                <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
            </header>

            <main className="flex-1 overflow-auto p-6">
                {userId ? (
                    <div className="grid h-full gap-4 md:grid-cols-2">
                        <div className="overflow-hidden">
                            <ProjectColumn
                                assignedUserId={userId}
                                isCompleted={false}
                                title="In Progress"
                                showToast={showToast}
                                onEditProject={handleEditProject}
                            />
                        </div>
                        <div className="overflow-hidden">
                            <ProjectColumn
                                assignedUserId={userId}
                                isCompleted={true}
                                title="Completed"
                                showToast={showToast}
                                onEditProject={handleEditProject}
                            />
                        </div>
                    </div>
                ) : null}
            </main>

            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                project={editingProject}
                showToast={showToast}
            />
        </div>
    );
};

export default UserDashboard;
