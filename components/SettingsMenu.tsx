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
            // Target dimensions for the settings modal
            // Changed to wider and shorter ratios to fit landscape mobile better
            const targetWidth = 750;
            const targetHeight = 450;

            const wScale = Math.min(1, (window.innerWidth - 20) / targetWidth);
            const hScale = Math.min(1, (window.innerHeight - 20) / targetHeight);

            let newScale = Math.min(wScale, hScale);

            // Clamp minimum scale
            if (newScale < 0.5) newScale = 0.5;

            // Specific check for very short landscape screens
            if (window.innerHeight < 450 && newScale > 0.45) {
                const tightHeightScale = (window.innerHeight - 20) / targetHeight; // Use targetHeight directly
                if (tightHeightScale < newScale) newScale = Math.max(0.45, tightHeightScale);
            }

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
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-3xl bg-stone-900 border-2 border-stone-600 shadow-[0_0_50px_rgba(0,0,0,1)] p-3 md:p-6 relative flex flex-col max-h-[90vh] overflow-hidden rounded-sm origin-center transition-transform duration-100"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="flex justify-between items-center mb-1 border-b border-stone-700 pb-1 sticky top-0 bg-stone-900 z-10 shrink-0">
                    <h2 className="text-lg md:text-xl font-black text-stone-200 tracking-widest pl-1">
                        CONFIG
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto px-2 pr-1 py-1">
                    {/* Pixelation */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-[10px] md:text-xs mb-0.5">
                            <span className="flex items-center gap-1.5"><Monitor size={12} /> RENDER RES</span>
                            <span>{settings.pixelScale.toFixed(1)}x</span>
                        </div>
                        <CustomSlider
                            min={1} max={6} step={0.5}
                            value={settings.pixelScale}
                            onChange={(val) => handleChange('pixelScale', val)}
                        />
                    </div>

                    {/* UI Scale */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-[10px] md:text-xs mb-0.5">
                            <span className="flex items-center gap-1.5"><Scaling size={12} /> HUD SCALE</span>
                            <span>{settings.uiScale.toFixed(2)}x</span>
                        </div>
                        <CustomSlider
                            min={0.6} max={1.4} step={0.1}
                            value={settings.uiScale}
                            onChange={(val) => handleChange('uiScale', val)}
                        />
                    </div>

                    {/* FOV */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-[10px] md:text-xs mb-0.5">
                            <span className="flex items-center gap-1.5"><Eye size={12} /> FOV</span>
                            <span>{settings.fov || 85}°</span>
                        </div>
                        <CustomSlider
                            min={60} max={110} step={1}
                            value={settings.fov || 85}
                            onChange={(val) => handleChange('fov', val)}
                        />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-[10px] md:text-xs mb-0.5">
                            <span className="flex items-center gap-1.5">🎵 MUSIC</span>
                            <span>{Math.round((settings.musicVolume ?? 0.5) * 100)}%</span>
                        </div>
                        <CustomSlider
                            min={0} max={1} step={0.1}
                            value={settings.musicVolume ?? 0.5}
                            onChange={(val) => handleChange('musicVolume', val)}
                        />
                    </div>

                    {/* SFX Volume */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 font-bold tracking-wider text-[10px] md:text-xs mb-0.5">
                            <span className="flex items-center gap-1.5">🔊 SFX</span>
                            <span>{Math.round((settings.sfxVolume ?? 0.7) * 100)}%</span>
                        </div>
                        <CustomSlider
                            min={0} max={1} step={0.1}
                            value={settings.sfxVolume ?? 0.7}
                            onChange={(val) => handleChange('sfxVolume', val)}
                        />
                    </div>
                </div>

                <div className="mt-1 pt-1 border-t border-stone-800 flex flex-row gap-2 flex-shrink-0">
                    <button onClick={onResetDefaults} className="flex-1 border border-stone-700 text-stone-500 hover:text-white hover:border-white px-2 py-1.5 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-colors">
                        <RotateCcw size={10} /> RESET
                    </button>
                    <button onClick={onClose} className="flex-[2] bg-stone-200 text-black font-black px-4 py-1.5 hover:bg-red-600 hover:text-white transition-colors tracking-widest text-[10px] md:text-xs">
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};