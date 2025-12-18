import React, { useState, useEffect } from 'react';
import { GameSettings } from '../types';
import { X, Monitor, Scaling, Eye, RotateCcw } from 'lucide-react';

interface SettingsMenuProps {
    settings: GameSettings;
    onUpdateSettings: (newSettings: GameSettings) => void;
    onClose: () => void;
    onResetDefaults: () => void;
}

// Custom Slider Component to prevent accidental clicks
const CustomSlider: React.FC<{
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (val: number) => void;
}> = ({ min, max, step, value, onChange }) => {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const updateValue = (clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const rawValue = min + percent * (max - min);
        // Stick to step
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.min(max, Math.max(min, steppedValue));
        onChange(clampedValue);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only allow dragging if clicking the thumb area
        e.preventDefault(); // Prevent scrolling while dragging
        setIsDragging(true);
        const target = e.target as HTMLElement;
        target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updateValue(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        const target = e.target as HTMLElement;
        target.releasePointerCapture(e.pointerId);
    };

    // Calculate percent for visual rendering
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div
            className="relative w-full h-8 flex items-center touch-none select-none"
            ref={trackRef}
        >
            {/* Track Background */}
            <div className="absolute w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                {/* Fill */}
                <div
                    className="h-full bg-stone-600"
                    style={{ width: `${percent}%` }}
                />
            </div>

            {/* Thumb - The Red Dot */}
            <div
                className="absolute w-6 h-6 bg-red-600 rounded-full border-2 border-stone-200 cursor-grab active:cursor-grabbing shadow-lg shadow-black/50 z-10 hover:scale-110 transition-transform"
                style={{ left: `calc(${percent}% - 12px)` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            // touch-action none is important for the thumb to prevent browser scrolling while dragging
            />
        </div>
    );
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdateSettings, onClose, onResetDefaults }) => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const targetWidth = 850;
            const targetHeight = 550;
            const wScale = Math.min(1, (window.innerWidth - 40) / targetWidth);
            const hScale = Math.min(1, (window.innerHeight - 40) / targetHeight);
            let newScale = Math.min(wScale, hScale);
            if (newScale < 0.6) newScale = 0.6;
            setScale(newScale);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleChange = (key: keyof GameSettings, value: number | boolean) => {
        onUpdateSettings({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div
                className="w-full max-w-2xl bg-stone-950/40 backdrop-blur-2xl border border-stone-800/50 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden rounded-2xl ring-1 ring-white/5"
                style={{ transform: `scale(${scale})` }}
            >
                {/* Decorative */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-stone-500/20 to-transparent" />

                {/* Header */}
                <div className="p-6 border-b border-stone-800/50 flex justify-between items-center bg-stone-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-900/60 rounded-xl border border-stone-800 flex items-center justify-center text-stone-400">
                            <Monitor size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase leading-tight">SETTINGS</h2>
                            <p className="text-[10px] text-stone-500 font-bold tracking-[0.4em] uppercase">Display & Audio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                    {/* Visuals Group */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-stone-500 font-extrabold tracking-[0.2em] uppercase text-[10px]">Graphics</h3>
                            <div className="h-[1px] flex-1 bg-stone-800/30" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Pixelation */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">Resolution</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{settings.pixelScale.toFixed(1)}x</span>
                                </div>
                                <CustomSlider
                                    min={1} max={6} step={0.5}
                                    value={settings.pixelScale}
                                    onChange={(val) => handleChange('pixelScale', val)}
                                />
                            </div>

                            {/* Brightness */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">Brightness</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{(settings.brightness * 100).toFixed(0)}%</span>
                                </div>
                                <CustomSlider
                                    min={0.1} max={2.0} step={0.1}
                                    value={settings.brightness}
                                    onChange={(val) => handleChange('brightness', val)}
                                />
                            </div>

                            {/* HUD Scale */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">HUD Scale</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{settings.uiScale.toFixed(2)}x</span>
                                </div>
                                <CustomSlider
                                    min={0.6} max={1.4} step={0.1}
                                    value={settings.uiScale}
                                    onChange={(val) => handleChange('uiScale', val)}
                                />
                            </div>

                            {/* FOV */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">Field of View</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{settings.fov || 85}°</span>
                                </div>
                                <CustomSlider
                                    min={60} max={110} step={1}
                                    value={settings.fov || 85}
                                    onChange={(val) => handleChange('fov', val)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Audio Group */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-stone-500 font-extrabold tracking-[0.2em] uppercase text-[10px]">Sound</h3>
                            <div className="h-[1px] flex-1 bg-stone-800/30" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Music Volume */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">Music</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{Math.round((settings.musicVolume ?? 0.5) * 100)}%</span>
                                </div>
                                <CustomSlider
                                    min={0} max={1} step={0.1}
                                    value={settings.musicVolume ?? 0.5}
                                    onChange={(val) => handleChange('musicVolume', val)}
                                />
                            </div>

                            {/* SFX Volume */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-stone-300 font-bold tracking-widest text-[10px] uppercase">Effects</span>
                                    <span className="text-white font-black text-xs tabular-nums bg-stone-900 px-2 py-0.5 rounded border border-white/5">{Math.round((settings.sfxVolume ?? 0.7) * 100)}%</span>
                                </div>
                                <CustomSlider
                                    min={0} max={1} step={0.1}
                                    value={settings.sfxVolume ?? 0.7}
                                    onChange={(val) => handleChange('sfxVolume', val)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-stone-800/50 bg-stone-950/40 backdrop-blur-xl flex flex-row gap-4">
                    <button onClick={onResetDefaults} className="flex-1 h-12 border border-stone-800 text-stone-500 hover:text-white hover:bg-white/5 px-4 font-black tracking-[0.2em] flex items-center justify-center gap-2 transition-all rounded-xl text-[10px] uppercase">
                        <RotateCcw size={14} /> Reset Defaults
                    </button>
                    <button onClick={onClose} className="flex-[1.5] h-12 bg-white text-black font-black px-6 hover:bg-stone-200 transition-all tracking-[0.3em] rounded-xl text-xs uppercase shadow-xl">
                        Return to Game
                    </button>
                </div>
            </div>
        </div>
    );
};