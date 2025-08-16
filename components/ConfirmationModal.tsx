
import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onCancel}>
            <div
                className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-sm m-4 relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-neutral-400 mb-8">{message}</p>

                <div className="flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md transition-colors"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2.5 px-6 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
