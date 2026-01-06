import { useMemo } from "react";
import { useBootstrapAuthQuery, useSignOutMutation } from "../../../services/appApi";
import { TopBar } from "../../../components/ui/TopBar";
import { Button } from "../../../components/ui/Button";
import type { ShowToast } from "../../../App";
import { UserProjectColumn } from "../components/UserProjectColumn";

type Props = {
    showToast: ShowToast;
};

const UserDashboard = ({ showToast }: Props) => {
    const { data } = useBootstrapAuthQuery();
    const userId = data?.userId ?? null;

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const subtitle = useMemo(() => {
        return "Click on projects to edit them. Drag projects between in progress and completed columns.";
    }, []);

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <TopBar
                title="Your Dashboard"
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

            <div className="flex-1 overflow-hidden p-4">
                {userId ? (
                    <div className="grid h-full gap-4 lg:grid-cols-2">
                        <UserProjectColumn assignedUserId={userId} isCompleted={false} title="In Progress" showToast={showToast} />
                        <UserProjectColumn assignedUserId={userId} isCompleted={true} title="Completed" showToast={showToast} />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default UserDashboard;
