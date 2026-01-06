import { supabase } from "../../../services/apiClient";
import type { ShowToast } from "../../../App";
import { Button } from "../../../components/ui/Button";

type Props = {
    disabled?: boolean;
    showToast: ShowToast;
};

export const LoginButton = ({ disabled, showToast }: Props) => {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (error) showToast("error", error.message);
    };

    return (
        <Button type="button" variant="secondary" onClick={handleGoogleLogin} disabled={disabled}>
            Continue with Google
        </Button>
    );
};
