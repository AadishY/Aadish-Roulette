import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Smile } from 'lucide-react';
import { ChatMessage } from '../types';
import { audioManager } from '../utils/audioManager';
import { LinkPreviewCard } from './ui/LinkPreviewCard';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    playerName: string;
}

const EMOJIS = [
    '🔫', '🍺', '🚬', '🪓', '📞', 
    '💬', '🤖', '💀', '🩸', '🃏', 
    '🎲', '⛓️', '🔍', '🛡️', '💥', 
    '❓', '⚠️', '❤️', '💔', '👍'
];

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, playerName }) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

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
            setShowEmojiPicker(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-stone-950 font-mono text-stone-300 md:border-l border-stone-900 overflow-hidden relative">
            {/* Header */}
            <div className="p-3 sm:p-6 border-b border-stone-900 bg-stone-900/10 flex justify-between items-center relative select-none shrink-0">
                <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-stone-500 uppercase flex items-center gap-1.5">
                    <Terminal size={10} className="text-cyan-500 animate-pulse sm:w-[12px] sm:h-[12px]" />
                    COMMUNICATION CHANNEL
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold text-stone-600 tracking-widest bg-stone-950/60 border border-stone-900 px-1.5 py-0.5 rounded uppercase">
                    ACTIVE_LINK
                </span>
            </div>

            {/* Message Stream */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 scrollbar-thin scrollbar-thumb-stone-900 scrollbar-track-transparent custom-scrollbar"
            >
                <div className="text-[8px] sm:text-[9px] text-stone-600 font-bold tracking-[0.3em] uppercase text-center border-b border-stone-900/35 pb-2 mb-3.5 select-none">
                    [ CHAT AREA ]
                </div>
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center select-none opacity-20 py-20">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-stone-500">
                            — SECURED FEED ENGAGED —
                        </span>
                    </div>
                ) : (
                    messages
                        .filter(m => m.sender === 'SYSTEM' ? (m.text.includes('joined') || m.text.includes('left') || m.text.includes('reconnected')) : !m.text.startsWith('SYSTEM:'))
                        .map((msg, i) => {
                        const isSystem = msg.sender === 'SYSTEM';
                        return (
                            <div 
                                key={i} 
                                className={`text-[10px] sm:text-xs leading-relaxed animate-in fade-in slide-in-from-left-1 duration-200 ${
                                    isSystem 
                                        ? 'py-1 border-y border-stone-900/35 my-1 bg-stone-950/40 px-2 rounded-lg italic text-amber-500/80 font-medium' 
                                        : 'group'
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
                                        <span className="text-stone-300 font-medium select-text break-all">
                                            {msg.text}
                                        </span>
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
            <form onSubmit={handleSubmit} className="p-3 sm:p-6 border-t border-stone-900 bg-stone-950/40 flex gap-2 relative keyboard-aware-bottom shrink-0">
                <div className="flex-1 relative flex items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="ENTER LOG ENCODING..."
                        maxLength={100}
                        className="w-full bg-stone-950 border border-stone-900 hover:border-stone-850 focus:border-cyan-500/40 rounded-xl pl-3 pr-9 py-2 sm:py-2.5 text-[11px] sm:text-sm font-bold tracking-wider outline-none transition-all text-stone-200 placeholder-stone-850"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            audioManager.playSound('click');
                            setShowEmojiPicker(!showEmojiPicker);
                        }}
                        className={`absolute right-2.5 p-1 transition-colors rounded-lg cursor-pointer ${
                            showEmojiPicker ? 'text-cyan-400' : 'text-stone-500 hover:text-cyan-400'
                        }`}
                    >
                        <Smile size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                </div>
                <button
                    type="submit"
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-cyan-500/50 rounded-xl transition-all text-stone-400 hover:text-cyan-400 active:scale-95 cursor-pointer flex items-center justify-center shadow-lg shrink-0"
                >
                    <Send size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>

                {/* Emoji Picker Overlay */}
                {showEmojiPicker && (
                    <>
                        <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setShowEmojiPicker(false)} 
                        />
                        <div className="absolute bottom-16 sm:bottom-20 right-3 z-50 p-2 bg-stone-950/95 border border-stone-900 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col gap-1.5 w-44 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <span className="text-[7px] font-black text-stone-550 tracking-[0.2em] border-b border-stone-900/60 pb-1 uppercase select-none block">
                                Tactical Emojis
                            </span>
                            <div className="grid grid-cols-5 gap-1">
                                {EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                            audioManager.playSound('click');
                                            setInputText(prev => prev + emoji);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-900/60 active:scale-90 transition-all text-sm sm:text-base cursor-pointer"
                                    >
                                        {emoji}
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
