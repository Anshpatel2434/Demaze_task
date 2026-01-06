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
        return "Drag projects between columns to update status. Click to edit.";
    }, []);

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <div className="shrink-0 px-6 pt-6">
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
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
                {userId ? (
                    <div className="grid h-full gap-4 md:grid-cols-2">
                        <ProjectColumn assignedUserId={userId} isCompleted={false} title="In Progress" showToast={showToast} />
                        <ProjectColumn assignedUserId={userId} isCompleted={true} title="Completed" showToast={showToast} />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default UserDashboard;
