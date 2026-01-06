import { useMemo, useState } from "react";
import { useSignOutMutation } from "../../../services/appApi";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { TopBar } from "../../../components/ui/TopBar";
import { Modal } from "../../../components/ui/Modal";
import type { ShowToast } from "../../../App";
import type { UserProfile } from "../../../types";
import { UserList } from "../components/UserList";
import { CreateProjectForm } from "../components/CreateProjectForm";
import { AdminProjectList } from "../components/AdminProjectList";

type Props = {
    showToast: ShowToast;
};

const AdminPage = ({ showToast }: Props) => {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const subtitle = useMemo(() => {
        return "Search users, create projects, and assign them with fast feedback.";
    }, []);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
            <TopBar
                title="Admin Dashboard"
                subtitle={subtitle}
                actions={
                    <Button
                        variant="ghost"
                        isLoading={isSigningOut}
                        onClick={async () => {
                            try {
                                await signOut().unwrap();
                                showToast("info", "Signed out.");
                            } catch (err) {
                                const message = (err as { data?: string })?.data ?? "Couldn't sign out";
                                showToast("error", message);
                            }
                        }}
                    >
                        Sign out
                    </Button>
                }
            />

            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Left side - User list */}
                <div className="w-80 flex-shrink-0">
                    <Card title="Users" className="h-full">
                        <UserList
                            selectedUserId={selectedUser?.id ?? null}
                            onSelect={(u) => {
                                setSelectedUser(u);
                                setKnownUsers((prev) => {
                                    if (prev.some((p) => p.id === u.id)) return prev;
                                    return [u, ...prev].slice(0, 50);
                                });
                            }}
                        />
                    </Card>
                </div>

                {/* Right side - Projects */}
                <div className="flex-1 flex flex-col gap-6">
                    <Card title="Project Management" className="flex-1">
                        <AdminProjectList 
                            selectedUser={selectedUser} 
                            knownUsers={knownUsers} 
                            showToast={showToast}
                        />
                    </Card>
                </div>
            </div>

            {/* Create Project Modal */}
            <Modal
                isOpen={isCreateProjectModalOpen}
                onClose={() => setIsCreateProjectModalOpen(false)}
                title="Create New Project"
            >
                <CreateProjectForm 
                    selectedUser={selectedUser} 
                    showToast={showToast}
                    onSuccess={() => setIsCreateProjectModalOpen(false)}
                />
            </Modal>

            {/* Floating Create Project Button */}
            <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 rounded-full bg-indigo-600 hover:bg-indigo-700 p-4 text-white shadow-lg transition-colors"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
            </button>
        </div>
    );
};

export default AdminPage;
