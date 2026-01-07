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

    const handleUserSelect = (user: UserProfile) => {
        setSelectedUser(user);
        setKnownUsers((prev) => {
            if (prev.some((p) => p.id === user.id)) return prev;
            return [user, ...prev].slice(0, 50);
        });
    };

    const handleKnownUsersChange = (users: UserProfile[]) => {
        setKnownUsers(users);
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <div className="shrink-0 px-5 pt-5">
                <TopBar
                    title="Admin Dashboard"
                    subtitle={subtitle}
                    actions={
                        <div className="flex gap-2">
                            <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                            <Button
                                variant="ghost"
                                className="text-slate-200 hover:bg-white/10 focus:ring-white/20"
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

            <div className="flex-1 overflow-hidden px-5 pb-5 pt-4">
                <div className="grid h-full gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                    <Card title="Users" className="flex min-h-0 flex-col overflow-hidden bg-slate-50">
                        <UserList
                            selectedUserId={selectedUser?.id ?? null}
                            onSelect={handleUserSelect}
                        />
                    </Card>

                    <Card title="Project list" className="flex min-h-0 flex-col overflow-hidden">
                        <AdminProjectList 
                            knownUsers={knownUsers} 
                            onKnownUsersChange={handleKnownUsersChange}
                            showToast={showToast} 
                        />
                    </Card>
                </div>
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                users={knownUsers}
                showToast={showToast}
            />
        </div>
    );
};

export default AdminPage;
