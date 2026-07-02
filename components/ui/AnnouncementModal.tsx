import React from 'react';
import { X, Bell } from 'lucide-react';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-3xl max-h-[95vh] bg-stone-950/95 border-2 border-stone-800/80 p-4 sm:p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] font-mono flex flex-col overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-300 hover:text-red-400 bg-stone-900/60 hover:bg-red-955/30 border border-stone-850 hover:border-red-500/45 p-1.5 sm:p-2 rounded-xl z-50 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all"
                    title="Close Announcement"
                >
                    <X size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500/30 animate-[scan-line-move_4s_linear_infinite]" />

                <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-900 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 text-amber-300 rounded-2xl">
                            <Bell size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-amber-400 font-black">System Announcement</p>
                            <h2 className="text-sm sm:text-base md:text-lg font-black text-stone-100 tracking-widest">Live Broadcast Panel</h2>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 text-[9px] sm:text-[10px] uppercase tracking-[0.35em] font-black bg-stone-900 border border-amber-500/30 text-amber-300 rounded-full">
                        PENDING
                    </span>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-1.5 text-stone-300 custom-scrollbar">
                    <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-3xl min-h-[180px] flex flex-col justify-center items-center text-center gap-3">
                        <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
                            No announcement content has been published yet.
                        </p>
                        <p className="text-stone-500 text-[10px] sm:text-[11px] uppercase tracking-[0.35em]">
                            This panel supports images, video, pinned notices, and rich broadcast content.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="h-40 md:h-44 rounded-3xl border border-stone-800 bg-stone-900/70 flex items-center justify-center text-stone-500 text-[10px] sm:text-sm text-center px-3">
                            Image / GIF panel placeholder
                        </div>
                        <div className="h-40 md:h-44 rounded-3xl border border-stone-800 bg-stone-900/70 flex items-center justify-center text-stone-500 text-[10px] sm:text-sm text-center px-3">
                            Video player placeholder
                        </div>
                    </div>

                    <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-3xl space-y-2">
                        <p className="text-stone-400 text-xs uppercase tracking-[0.35em] font-bold">Announcement Notes</p>
                        <ul className="list-disc list-inside text-stone-500 text-[11px] leading-relaxed space-y-1">
                            <li>Force show once when a new announcement version is available.</li>
                            <li>Supports multi-media content and pinned message state.</li>
                            <li>Designed to display rich promo and system broadcast content.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
