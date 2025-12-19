import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    playerName: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, playerName }) => {
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/80 border border-stone-800 rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="p-2 border-b border-stone-800 bg-stone-900/50 flex justify-between items-center">
                <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">Communications</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-stone-800"
            >
                {messages.map((msg, i) => (
                    <div key={i} className="text-sm leading-relaxed animate-in fade-in slide-in-from-left-1 duration-300">
                        <span style={{ color: msg.color }} className="font-bold mr-2 uppercase tracking-tight">
                            {msg.sender}:
                        </span>
                        <span className="text-stone-300">{msg.text}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-2 border-t border-stone-800 bg-stone-900/30 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="TYPE MESSAGE..."
                    className="flex-1 bg-black/50 border border-stone-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-900/50 transition-colors text-stone-200"
                />
                <button
                    type="submit"
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded transition-colors text-stone-300"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};
