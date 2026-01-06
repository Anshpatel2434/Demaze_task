import { useMemo, useState } from "react";
import { useSignOutMutation } from "../../../services/appApi";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { TopBar } from "../../../components/ui/TopBar";
import { CreateProjectModal } from "../../../components/ui/CreateProjectModal";
import type { ShowToast } from "../../../App";
import type { UserProfile } from "../../../types";
import { UserList } from "../components/UserList";
import { AdminProjectList } from "../components/AdminProjectList";

type Props = {
    showToast: ShowToast;
};

const AdminPage = ({ showToast }: Props) => {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const subtitle = useMemo(() => {
        return "Search users, create projects, and assign them with fast feedback.";
    }, []);

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <div className="shrink-0 px-6 pt-6">
                <TopBar
                    title="Admin Dashboard"
                    subtitle={subtitle}
                    actions={
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
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
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
                <div className="grid h-full gap-4 lg:grid-cols-2">
                    <Card title="Users" className="flex flex-col overflow-hidden">
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

                    <Card title="Project list" className="flex flex-col overflow-hidden">
                        <AdminProjectList knownUsers={knownUsers} showToast={showToast} />
                    </Card>
                </div>
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
