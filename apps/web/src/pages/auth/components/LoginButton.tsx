import { supabase } from "../../../services/apiClient";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../../components/ui/Button";

type Props = {
    disabled?: boolean;
};

export const LoginButton = ({ disabled }: Props) => {
    const toast = useToast();

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (error) toast.error(error.message, `oauth:${error.message}`);
    };

    return (
        <Button type="button" variant="secondary" onClick={handleGoogleLogin} disabled={disabled}>
            Continue with Google
        </Button>
    );
};
