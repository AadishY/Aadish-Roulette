import React from 'react';
import { X, Terminal } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-3xl max-h-[95vh] bg-stone-950/95 border-2 border-stone-800/80 p-3.5 sm:p-6 md:p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] font-mono flex flex-col overflow-hidden">
                <button
                    onClick={() => {
                        audioManager.playSound('click');
                        onClose();
                    }}
                    className="absolute top-3 right-3 sm:top-5 sm:right-5 text-stone-300 hover:text-red-400 bg-stone-900/60 hover:bg-red-955/30 border border-stone-850 hover:border-red-500/45 p-1.5 sm:p-2 rounded-xl z-50 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all small-btn"
                    title="Close Console"
                >
                    <X size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-650/40 animate-[scan-line-move_4s_linear_infinite]" />
                <div className="text-stone-350 font-black border-b border-stone-900 pb-2.5 mb-3.5 sm:pb-4 sm:mb-5 flex items-center justify-between uppercase tracking-wider text-xs sm:text-base">
                    <span className="flex items-center gap-2">
                        <Terminal size={14} className="text-red-500 sm:w-[18px] sm:h-[18px]" />
                        System Changelog
                    </span>
                    <span className="text-red-500/80 animate-pulse flex items-center gap-1.5 text-[10px] sm:text-xs bg-red-950/20 border border-red-900/35 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg mr-8 sm:mr-10">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                        active
                    </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3 text-left flex-1 min-h-0 overflow-y-auto pr-1.5 select-text scrollbar-thin text-[9px] sm:text-[10px] md:text-xs text-stone-400 custom-scrollbar">
                    <div className="space-y-1.5 bg-cyan-950/20 border border-cyan-500/40 p-2.5 sm:p-3.5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-[pulse_4s_ease-in-out_infinite]">
                        <div className="flex items-center gap-2 border-b border-cyan-900 pb-1.5">
                            <span className="px-2 py-0.5 bg-cyan-500 text-stone-950 text-[9px] font-black rounded uppercase tracking-widest select-none">PINNED</span>
                            <span className="text-cyan-400 font-black text-[10px] sm:text-xs tracking-wider uppercase">MULTIPLAYER IS OUT!</span>
                        </div>
                        <p className="leading-relaxed text-stone-300 text-[10px] sm:text-[11px]">
                            Lobby matches, FOR NOW ONLY 1v1, and real-time interactive game synchronization are fully live! Challenge opponents on mobile and desktop devices.
                        </p>
                    </div>

                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[July 2, 2026 - Sticker UX, Responsive UI & Player Models (v1.5.0)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">New sticker pack support for lobby and in-game chat, including expressive reactions and animated flair for multiplayer sessions.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Expanded player model selection with fresh visual variants for a more personalized match experience.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">IMPROVED</span>
                                <span className="leading-relaxed">Responsive menu and HUD scaling across mobile, tablet, and desktop for cleaner layouts and better usability.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Visual polish for sticker delivery, player avatar presentation, and overall interface consistency in the main menu.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 27, 2026 - Performance profiles & Turn Keeping fixes (v1.4.3)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Tactical Stickers: Send animated WebP/GIF stickers in the lobby and inline chat. Pinned jackpot immunity sticker is automatically triggered and displayed during gameplay.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">GPU Thermal Throttling: Automatically caps rendering to 24 FPS in all menu and lobby states, and utilizes Linear Tone Mapping in Balanced performance modes to decrease mobile device heat.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Mobile Pointing Toggles: Reworked dual-target pointing on touch screens, requiring a clear selection confirmation tap instead of instantly firing.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Turn Retaining on Last Shell: In multiplayer, if a player shoots themselves with a blank on the last shell in the chamber, they now correctly retain their turn for the next batch.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg animate-pulse-slow">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 22, 2026 - Server Performance & Memory Leaks Cleanups (v1.4.2)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Stateless Throttling Engine: Replaced per-connection background intervals with high-frequency timestamp differential calculations, reducing server memory allocation loads.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Allocation Pools: Moved join logic handlers outside the connection events closure scope to minimize dynamic javascript stack overheads.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">RECONNECTED</span>
                                <span className="leading-relaxed">Seamless Link Recovery: Reconnecting players using duplicate identities overwrite obsolete socket descriptors cleanly, avoiding ghost nodes in active rooms.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">CLEANED</span>
                                <span className="leading-relaxed">Resource GC Safeguard: Room memory collector ejects lingering socket connections upon purging inactive rooms, and React layout hooks clear initial check timers to prevent leak states.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 22, 2026 - Crash Prevention & Connection Stability (v1.4.1)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Crash & Freeze Protection: Listens for mid-game opponent disconnect alerts to instantly clear variables and cleanly redirect survivors back to the room lobby.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Fallback Long-Polling Transport: Socket connections now seamlessly fall back to polling transport when WebSockets are blocked by proxies.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">REFACTORED</span>
                                <span className="leading-relaxed">Code Deduplication: Extracted room configuration builders on the server and cache configuration loading hooks on the client.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Server Spec Diagnostic Labels: Diagnostics screen correctly formats RANDOM attribute markers to "RNDM" instead of absolute sentinel integers.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 21, 2026 - Final Polish & Multiplayer Optimizations (v1.4.0)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Multiplayer Manual Section: Reorganized the Tactical Manual and added a Multiplayer overview section with item page pagination adjustments.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Visual Performance Optimizations: Auto-disables GPU-heavy CRT and scanline overlay animations during active multiplayer window configurations to boost FPS.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Chatarea Status Indicator: In-game chat boxes now present an informative label identifying system-wide messaging nodes and join notices.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 21, 2026 - Multiplayer settings & performance update (v1.3.0)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">RANDOM Lobby Settings: Default starting health and items per shipment are set to RANDOM (value 9) on lobby entrance.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Advanced Settings Auto-Disable: Keeps Advanced Configuration toggled off initially when creating or joining rooms.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Full Selection Layout Scaling: Locks stable horizontal three-column layout deck on mobile viewports with no cards wrapping.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Background WebGL Rendering: Pauses animation tick loops and hides container element completely when selection/lobby screens are active.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 20, 2026 - Calibration & Smart AI Update (v1.2.1)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Smart Dealer AI Jackpot counters: Hard Mode Dealer avoids wasting Saw (90% chance) and uses Inverter (85% chance) on known live shells to flip them to blank and keep turn. Normal Mode has 70% chance to avoid wasting Saw.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Tactile Potato Mode inventory: slots slide up by -8px on hover/select and show distinct solid amber border outlines.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Increased Hard Mode Dealer peeking rates to 70% supernatural intuition and 90% optimal Tarot card selection.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Dynamic Quality Profile Syncing: quality changes automatically re-compile WebGL materials and update shadow maps.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 20, 2026 - Tarot Deck & Items Update (v1.2.0)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Tarot Card Deck (DECK_CARD) for drawing 1 of 6 active/passive Tarot cards.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">New items: Lucky Charm, Flashbang, Crusher, Totem, Mirror and Tarot Cards.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Redesigned the Mirror model to be a handle-free gold ornate oval hand-mirror.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">UPDATED</span>
                                <span className="leading-relaxed">Hermit card ends turn instantly; Judgment converted shell probability adjusted to 50%.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Tarot Card cheats in debug panel now correctly trigger fanning and flip-reveal animations.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 15, 2026 - Mobile & Stats Polish (v1.1.3)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Debug Mode with cheat options (ignores stats/leaderboard).</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Responsive mobile layout scaling for career & login views.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Menu clipping fixes and manual guide scroll tuning on mobile.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Career matches now display accurate historical local dates.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-stone-200 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 15, 2026 - Calibration & Polish (v1.1.1)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Ultra Performance mode profile (no shadows, flat UI, 60FPS).</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Redesigned glassmorphic Live/Blank count start panels.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Dynamic High-fidelity shell icons in main HUD indicators.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Eliminated stutters by cleaning up setups at round starts.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Lighting performance adjustments and menu box scalability.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-stone-300 font-black block border-b border-stone-900 pb-1 text-[10px] sm:text-[11px] md:text-xs tracking-wider">[June 14, 2026 - System Calibration & Redesign (v1.1.0)]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Redesigned cyber-themed login console & quote header.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Smart default presets mapped out for PC versus Mobile.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Fixed items overflow grids on mobile landscape layouts.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Detailed player rank indicators on podium leaderboard.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">OPTIMIZED</span>
                                <span className="leading-relaxed">Neon hover borders and smooth button click transitions.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-1.5 bg-stone-950 border border-stone-900/60 p-2.5 sm:p-3.5 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
                        <span className="text-stone-400 font-black block border-b border-stone-900 pb-1 text-[9px] sm:text-[10px] tracking-wider">[Previous Deployments]</span>
                        <ul className="list-none space-y-1.5 pl-0.5">
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-800/40 text-green-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">ADDED</span>
                                <span className="leading-relaxed">Implemented device-aware graphics profiles (Mobile, Tablet, PC).</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">FIXED</span>
                                <span className="leading-relaxed">Disabled shadows on mobile/tablet to secure stable 60FPS.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="px-1.5 py-0.5 bg-blue-950/50 border border-blue-800/40 text-blue-400 text-[8px] font-black rounded-md uppercase tracking-widest shrink-0 select-none">SYSTEM</span>
                                <span className="leading-relaxed">Added reroll penalty for duplicate item drops.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={() => {
                        audioManager.playSound('click');
                        onClose();
                    }}
                    className="mt-4 sm:mt-6 w-full py-2.5 sm:py-4 bg-stone-900 border border-stone-850 hover:border-stone-600 hover:text-white text-stone-400 font-bold text-[10px] sm:text-xs tracking-[0.4em] uppercase transition-all rounded-xl cursor-pointer active:scale-98 shadow-md"
                >
                    Close Console
                </button>
            </div>
        </div>
    );
};
