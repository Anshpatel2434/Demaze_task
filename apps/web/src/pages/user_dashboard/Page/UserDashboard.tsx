import { useMemo } from "react";
import { useBootstrapAuthQuery, useSignOutMutation } from "../../../services/appApi";
import { TopBar } from "../../../components/ui/TopBar";
import { Button } from "../../../components/ui/Button";
import type { ShowToast } from "../../../App";
import { ProjectColumn } from "../components/ProjectColumn";

type Props = {
    showToast: ShowToast;
};

const UserDashboard = ({ showToast }: Props) => {
    const { data } = useBootstrapAuthQuery();
    const userId = data?.userId ?? null;

    const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

    const subtitle = useMemo(() => {
        return "Drag projects between columns to update status. Edits save automatically.";
    }, []);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
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

            {userId ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <ProjectColumn assignedUserId={userId} isCompleted={false} title="In Progress" showToast={showToast} />
                    <ProjectColumn assignedUserId={userId} isCompleted={true} title="Completed" showToast={showToast} />
                </div>
            ) : null}
        </div>
    );
};

export default UserDashboard;
