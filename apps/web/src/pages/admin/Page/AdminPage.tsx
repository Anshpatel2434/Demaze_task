import { useMemo, useState } from "react";
import { useSignOutMutation } from "../../../services/appApi";
import { Button } from "../../../components/ui/Button";
import { TopBar } from "../../../components/ui/TopBar";
import type { ShowToast } from "../../../App";
import type { UserProfile } from "../../../types";
import { UserList } from "../components/UserList";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { AdminProjectColumn } from "../components/AdminProjectColumn";

type Props = {
    showToast: ShowToast;
};

const AdminPage = ({ showToast }: Props) => {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);
    const [showCreateProject, setShowCreateProject] = useState(false);

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const subtitle = useMemo(() => {
        return "Search users, create projects, and assign them by dragging users to projects.";
    }, []);

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <TopBar
                title="Admin Dashboard"
                subtitle={subtitle}
                actions={
                    <>
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateProject(true)}
                            className="mr-3"
                        >
                            Create Project
                        </Button>
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
                    </>
                }
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Users */}
                <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
                    <div className="p-4">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Users</h2>
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
                    </div>
                </div>

                {/* Right Content - Projects */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col gap-4">
                        {/* Selected User Info */}
                        {selectedUser ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                <p className="text-sm font-medium text-blue-900">Selected User: {selectedUser.email}</p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                                <p className="text-sm text-yellow-800">Select a user from the left panel to enable drag-to-assign</p>
                            </div>
                        )}

                        {/* Project Columns */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            <AdminProjectColumn
                                selectedUser={selectedUser}
                                knownUsers={knownUsers}
                                showToast={showToast}
                                isCompleted={false}
                                title="In Progress"
                            />
                            <AdminProjectColumn
                                selectedUser={selectedUser}
                                knownUsers={knownUsers}
                                showToast={showToast}
                                isCompleted={true}
                                title="Completed"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <CreateProjectModal
                isOpen={showCreateProject}
                onClose={() => setShowCreateProject(false)}
                showToast={showToast}
            />
        </div>
    );
};

export default AdminPage;
