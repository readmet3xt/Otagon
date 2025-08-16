

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PendingInsightModification } from '../services/types';

interface InsightActionModalProps {
    currentTitle: string;
    suggestion: PendingInsightModification;
    onOverwrite: () => void;
    onCreateNew: () => void;
    onCancel: () => void;
}

const InsightActionModal: React.FC<InsightActionModalProps> = ({
    currentTitle,
    suggestion,
    onOverwrite,
    onCreateNew,
    onCancel,
}) => {
    const hasNewTitle = suggestion.title !== currentTitle;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onCancel}>
            <div
                className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-2xl m-4 relative flex flex-col max-h-[90vh] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-2">Update Insight</h2>
                <p className="text-neutral-400 mb-6">
                    The AI has suggested changes for your <strong className="text-white">"{currentTitle}"</strong> tab.
                    {hasNewTitle && <> It will be renamed to <strong className="text-white">"{suggestion.title}"</strong>.</>}
                     How would you like to proceed?
                </p>

                <div className="flex-grow overflow-y-auto p-4 bg-black/30 rounded-lg border border-neutral-700 mb-6">
                    <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-p:text-[#CFCFCF] prose-headings:text-white prose-strong:text-white prose-a:text-[#FFAB40] hover:prose-a:underline">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {suggestion.content}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0">
                    <button
                        onClick={onOverwrite}
                        className="w-full sm:w-auto bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-6 rounded-md transition-transform hover:scale-105"
                    >
                        {hasNewTitle ? 'Rename & Overwrite' : 'Overwrite'}
                    </button>
                    <button
                        onClick={onCreateNew}
                        className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-6 rounded-md transition-colors"
                    >
                        Create New Tab
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

export default InsightActionModal;