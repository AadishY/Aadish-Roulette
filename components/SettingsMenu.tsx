import React from 'react';
import { GameSettings } from '../types';
import { X, Monitor, Sun, Scaling, Eye, Tv, RotateCcw } from 'lucide-react';

interface SettingsMenuProps {
    settings: GameSettings;
    onUpdateSettings: (newSettings: GameSettings) => void;
    onClose: () => void;
    onResetDefaults: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdateSettings, onClose, onResetDefaults }) => {

    const handleChange = (key: keyof GameSettings, value: number | boolean) => {
        onUpdateSettings({ ...settings, [key]: value });
    };

    return (
        // Fixed positioning with flex centering. 
        // pointer-events-none on wrapper to let clicks pass through edges if needed, though usually modal blocks.
        // pointer-events-auto on the modal itself.
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-stone-900 border-2 border-stone-600 shadow-[0_0_50px_rgba(0,0,0,1)] p-6 md:p-8 relative flex flex-col max-h-[85vh] overflow-hidden rounded-sm">
                <div className="flex justify-between items-center mb-6 border-b border-stone-700 pb-4 sticky top-0 bg-stone-900 z-10">
                    <h2 className="text-2xl md:text-3xl font-black text-stone-200 tracking-widest">
                        CONFIG
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                    {/* Pixelation */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-xs md:text-sm">
                            <span className="flex items-center gap-2"><Monitor size={16} /> RENDER RES</span>
                            <span>{settings.pixelScale.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="6" step="0.5"
                            value={settings.pixelScale}
                            onChange={(e) => handleChange('pixelScale', parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600"
                        />
                    </div>

                    {/* UI Scale */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-xs md:text-sm">
                            <span className="flex items-center gap-2"><Scaling size={16} /> HUD SCALE</span>
                            <span>{settings.uiScale.toFixed(2)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.6" max="1.4" step="0.1"
                            value={settings.uiScale}
                            onChange={(e) => handleChange('uiScale', parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600"
                        />
                    </div>

                    {/* FOV */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-xs md:text-sm">
                            <span className="flex items-center gap-2"><Eye size={16} /> FOV</span>
                            <span>{settings.fov || 85}°</span>
                        </div>
                        <input
                            type="range"
                            min="60" max="110" step="1"
                            value={settings.fov || 85}
                            onChange={(e) => handleChange('fov', parseInt(e.target.value))}
                            className="w-full h-2 bg-stone-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600"
                        />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-xs md:text-sm">
                            <span className="flex items-center gap-2">🎵 MUSIC</span>
                            <span>{Math.round((settings.musicVolume ?? 0.5) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.1"
                            value={settings.musicVolume ?? 0.5}
                            onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600"
                        />
                    </div>

                    {/* SFX Volume */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-xs md:text-sm">
                            <span className="flex items-center gap-2">🔊 SFX</span>
                            <span>{Math.round((settings.sfxVolume ?? 0.7) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.1"
                            value={settings.sfxVolume ?? 0.7}
                            onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800 flex flex-col gap-3 flex-shrink-0">
                    <button onClick={onClose} className="w-full bg-stone-200 text-black font-black px-8 py-3 hover:bg-red-600 hover:text-white transition-colors tracking-widest text-sm">
                        CLOSE
                    </button>
                    <button onClick={onResetDefaults} className="w-full border border-stone-700 text-stone-500 hover:text-white hover:border-white px-4 py-2 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-colors">
                        <RotateCcw size={12} /> RESET DEFAULTS
                    </button>
                </div>
            </div>
        </div>
    );
};