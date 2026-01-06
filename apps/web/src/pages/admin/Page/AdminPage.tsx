import { useState } from "react";
import { useSignOutMutation } from "../../../services/appApi";
import type { ShowToast } from "../../../App";
import type { UserProfile } from "../../../types";
import { UserList } from "../components/UserList";
import { AdminProjectList } from "../components/AdminProjectList";
import { CreateProjectModal } from "../components/CreateProjectModal";

type Props = {
    showToast: ShowToast;
};

const AdminPage = ({ showToast }: Props) => {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500">Drag users to assign projects</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!selectedUser}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Create Project
                    </button>
                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-auto">
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
                            setKnownUsers={setKnownUsers}
                        />
                    </div>
                </aside>

                <main className="flex-1 overflow-auto p-6">
                    <AdminProjectList knownUsers={knownUsers} showToast={showToast} />
                </main>
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                selectedUser={selectedUser}
                showToast={showToast}
            />
        </div>
    );
};

export default AdminPage;
