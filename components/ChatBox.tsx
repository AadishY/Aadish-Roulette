import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Smile } from 'lucide-react';
import { ChatMessage } from '../types';
import { audioManager } from '../utils/audioManager';
import { LinkPreviewCard } from './ui/LinkPreviewCard';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    playerName: string;
    stickers?: string[];
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, playerName, stickers = [] }) => {
    const [inputText, setInputText] = useState('');
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Dynamic sticker detection (probes both webp and gif) and preloading


    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            audioManager.playSound('click');
            onSendMessage(inputText.trim());
            setInputText('');
            setShowStickerPicker(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-stone-950 font-mono text-stone-300 md:border-l border-stone-900/30 overflow-hidden relative">
            {/* Header */}
            <div className="p-3 sm:p-5 border-b border-stone-900/40 bg-stone-900/10 flex justify-between items-center relative select-none shrink-0">
                <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-stone-550 uppercase flex items-center gap-1.5">
                    <Terminal size={10} className="text-cyan-500 animate-pulse sm:w-[12px] sm:h-[12px]" />
                    ChatBox
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold text-stone-600 tracking-widest bg-stone-950/60 border border-stone-900/50 px-1.5 py-0.5 rounded uppercase">
                    Live
                </span>
            </div>

            {/* Message Stream */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-900 scrollbar-track-transparent custom-scrollbar"
            >
                <div className="text-[8px] sm:text-[9px] text-stone-600 font-bold tracking-[0.3em] uppercase text-center border-b border-stone-900/20 pb-2 mb-3.5 select-none">
                    [ CHAT AREA ]
                </div>
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center select-none opacity-20 py-20">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-stone-550">
                            — SECURED FEED ENGAGED —
                        </span>
                    </div>
                ) : (
                    messages
                        .filter(m => m.sender === 'SYSTEM' 
                            ? (m.text.includes('joined') || m.text.includes('left') || m.text.includes('reconnected')) 
                            : !m.text.startsWith('SYSTEM:')) // Lobby displays stickers inline in the feed list
                        .map((msg, i) => {
                        const isSystem = msg.sender === 'SYSTEM';
                        return (
                            <div 
                                key={i} 
                                className={`text-[10px] sm:text-xs leading-relaxed animate-in fade-in slide-in-from-left-1 duration-200 ${
                                    isSystem 
                                        ? 'py-1.5 border-y border-stone-900/20 my-1.5 bg-stone-950/40 px-2 rounded-lg italic text-amber-500/80 font-medium' 
                                        : 'group py-1.5 px-2.5 my-0.5 rounded-lg hover:bg-stone-900/20 transition-all border border-transparent hover:border-stone-900/30'
                                    }`}
                            >
                                {!isSystem ? (
                                    <>
                                        <span 
                                            style={{ color: msg.color }} 
                                            className="font-black mr-2 uppercase tracking-wide transition-opacity opacity-90 group-hover:opacity-100 select-none"
                                        >
                                            {msg.sender}:
                                        </span>
                                        {msg.text.startsWith('[STICKER]:') ? (
                                            <div className="my-2 p-1.5 bg-stone-900/10 border border-stone-900/20 rounded-lg w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] select-none">
                                                <img 
                                                    src={`/sticker/${msg.text.split(':')[1]}`} 
                                                    alt="Sticker" 
                                                    className="w-full h-full object-contain rounded-md animate-in zoom-in-95 duration-200" 
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-stone-300 font-medium select-text break-all">
                                                {msg.text}
                                            </span>
                                        )}
                                        {(() => {
                                            const url = msg.text.match(/https?:\/\/[^\s]+/)?.[0];
                                            return url ? <LinkPreviewCard url={url} /> : null;
                                        })()}
                                    </>
                                ) : (
                                    <span className="tracking-wider select-text flex items-center gap-1.5">
                                        <span className="w-1 h-1 bg-amber-500 rounded-full animate-ping shrink-0" />
                                        {msg.text}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-1.5 sm:p-4 border-t border-stone-900/40 bg-stone-950/40 flex items-center gap-1 sm:gap-2 relative keyboard-aware-bottom shrink-0">
                {/* Sticker Picker Button (Square Box) */}
                <button
                    type="button"
                    onClick={() => {
                        audioManager.playSound('click');
                        setShowStickerPicker(!showStickerPicker);
                    }}
                    className={`w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 shadow-md ${
                        showStickerPicker 
                            ? 'bg-stone-900 border-cyan-500/50 text-cyan-400' 
                            : 'bg-stone-900/60 border-stone-900/40 text-stone-500 hover:text-cyan-400 hover:border-cyan-500/30'
                    }`}
                    title="Select Sticker"
                >
                    <Smile size={11} className="sm:w-[17px] sm:h-[17px]" />
                </button>

                {/* Text Typing Area */}
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="ENTER LOG ENCODING..."
                    maxLength={100}
                    className="flex-grow w-0 min-w-0 bg-stone-950 border border-stone-900/60 hover:border-stone-850 focus:border-cyan-500/40 focus:bg-stone-950/80 rounded-lg sm:rounded-xl px-2 sm:px-3.5 py-1 sm:py-2 text-[9px] sm:text-xs font-bold tracking-wider outline-none transition-all text-stone-200 placeholder-stone-850 shadow-inner"
                />

                {/* Send Button (Smaller Size) */}
                <button
                    type="submit"
                    className="w-6 h-6 sm:w-10 sm:h-10 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-cyan-500/40 rounded-lg sm:rounded-xl transition-all text-stone-400 hover:text-cyan-400 active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
                >
                    <Send size={9} className="sm:w-[14px] sm:h-[14px]" />
                </button>

                {/* Sticker Picker Overlay */}
                {showStickerPicker && (
                    <>
                        <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setShowStickerPicker(false)} 
                        />
                        <div className="absolute bottom-16 sm:bottom-20 left-3 right-3 sm:right-auto z-50 p-2 sm:p-3 bg-stone-950/95 border border-stone-900 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col gap-1.5 w-auto sm:w-56 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <span className="text-[7px] sm:text-[8px] font-black text-stone-550 tracking-[0.2em] border-b border-stone-900/60 pb-1 uppercase select-none block">
                                Stickers
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 overflow-y-auto max-h-48 custom-scrollbar pr-0.5">
                                {stickers.map((stk) => (
                                    <button
                                        key={stk}
                                        type="button"
                                        onClick={() => {
                                            audioManager.playSound('click');
                                            onSendMessage('[STICKER]:' + stk);
                                            setShowStickerPicker(false);
                                        }}
                                        className="w-7 h-7 sm:w-11 sm:h-11 flex items-center justify-center rounded border border-stone-900 bg-stone-950 hover:bg-stone-900/80 hover:border-cyan-500/55 p-0.5 sm:p-1 active:scale-95 transition-all cursor-pointer"
                                        title={stk}
                                    >
                                        <img 
                                            src={`/sticker/${stk}`} 
                                            alt={stk} 
                                            className="w-full h-full object-contain rounded" 
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};
