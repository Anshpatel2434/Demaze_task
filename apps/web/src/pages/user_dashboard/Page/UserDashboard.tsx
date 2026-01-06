import { useMemo } from "react";
import { useBootstrapAuthQuery, useSignOutMutation } from "../../../services/appApi";
import { TopBar } from "../../../components/ui/TopBar";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../hooks/useToast";
import { ProjectColumn } from "../components/ProjectColumn";

const UserDashboard = () => {
    const toast = useToast();
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
                                toast.info("Signed out.", "auth:signout");
                            } catch (err) {
                                const message = (err as { data?: string })?.data ?? "Couldn't sign out";
                                toast.error(message, `auth:signout:error:${message}`);
                            }
                        }}
                    >
                        Sign out
                    </Button>
                }
            />

            {userId ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <ProjectColumn assignedUserId={userId} isCompleted={false} title="In Progress" />
                    <ProjectColumn assignedUserId={userId} isCompleted={true} title="Completed" />
                </div>
            ) : null}
        </div>
    );
};

export default UserDashboard;
