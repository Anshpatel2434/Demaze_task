import { Modal } from "../../../components/ui/Modal";
import { CreateProjectForm } from "./CreateProjectForm";
import type { ShowToast } from "../../../App";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    showToast: ShowToast;
};

export function CreateProjectModal({ isOpen, onClose, showToast }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
            <CreateProjectForm selectedUser={null} showToast={showToast} />
            <div className="mt-4 flex justify-end">
                <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}