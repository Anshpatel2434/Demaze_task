import { useMemo, useState } from "react";
import { useSignOutMutation } from "../../../services/appApi";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { TopBar } from "../../../components/ui/TopBar";
import { useToast } from "../../../hooks/useToast";
import type { UserProfile } from "../../../types";
import { UserList } from "../components/UserList";
import { CreateProjectForm } from "../components/CreateProjectForm";
import { AdminProjectList } from "../components/AdminProjectList";

const AdminPage = () => {
	const toast = useToast();
	const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
	const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);

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

			<div className="grid gap-4 lg:grid-cols-3">
				<Card title="Users" className="lg:col-span-1">
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

				<Card title="Create project" className="lg:col-span-1">
					<CreateProjectForm selectedUser={selectedUser} />
				</Card>

				<Card title="Project list" className="lg:col-span-1">
					<AdminProjectList selectedUser={selectedUser} knownUsers={knownUsers} />
				</Card>
			</div>
		</div>
	);
};

export default AdminPage;
