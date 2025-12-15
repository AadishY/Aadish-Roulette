import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Target, Beer, Cigarette, Scale, Link, Scissors, Phone, RefreshCw, Zap, Settings, Users, Code, Github, Instagram, Gamepad2, HelpCircle, Shield, Heart, Crosshair, CircleDot, Smartphone, Monitor, Volume2, Maximize, Eye } from 'lucide-react';
import { GAME_VERSION } from '../constants';
import { Icons } from './ui/Icons';

interface TutorialGuideProps {
    onClose: () => void;
}

interface GuidePage {
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const ItemCard: React.FC<{
    icon: React.ReactNode;
    name: string;
    description: string;
    color: string;
    effect?: string;
}> = ({ icon, name, description, color, effect }) => (
    <div className="bg-gradient-to-r from-stone-900/90 to-stone-800/50 border border-stone-700/50 p-2 md:p-3 flex gap-2 md:gap-3 items-start hover:border-stone-500 transition-all hover:shadow-lg hover:shadow-black/20 rounded-sm">
        <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-stone-900 border border-stone-600 shrink-0 ${color} rounded-sm shadow-inner`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-black text-stone-100 tracking-wider mb-0.5 text-xs md:text-sm">{name}</h4>
            <p className="text-stone-400 text-[10px] md:text-xs leading-tight">{description}</p>
            {effect && (
                <div className="mt-1 text-[10px] font-bold text-amber-500 bg-amber-950/30 px-1.5 py-0.5 inline-block rounded-sm">
                    {effect}
                </div>
            )}
        </div>
    </div>
);

const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    color: string;
}> = ({ icon, title, children, color }) => (
    <div className={`bg-stone-900/60 border-l-4 ${color} p-3 md:p-4 rounded-r-sm`}>
        <h3 className={`font-black mb-2 flex items-center gap-2 text-sm md:text-base ${color.replace('border-', 'text-').replace('-500', '-400').replace('-600', '-500')}`}>
            {icon} {title}
        </h3>
        <p className="text-stone-300 text-xs md:text-sm leading-relaxed">
            {children}
        </p>
    </div>
);

export const TutorialGuide: React.FC<TutorialGuideProps> = ({ onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const targetWidth = 1000; // Reference width - Wide for grid, but can be scaled
            const targetHeight = 420; // Reference height - EVEN LOWER to aggressively scale up on short screens

            const wScale = Math.min(1, (window.innerWidth - 20) / targetWidth);
            const hScale = Math.min(1, (window.innerHeight - 20) / targetHeight);

            let newScale = Math.min(wScale, hScale);

            if (newScale < 0.6) newScale = 0.6;

            // Removed complex tightHeightScale logic as simply lowering targetHeight is more effective for this case

            setScale(newScale);
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Swipe detection for mobile
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
        if (isRightSwipe && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const pages: GuidePage[] = [
        // Page 1: Game Logic - How to Play
        {
            title: "HOW TO PLAY",
            icon: <Gamepad2 size={20} className="text-red-500" />,
            content: (
                <div className="space-y-4">
                    <div className="text-center mb-4 md:mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
                            <Gamepad2 size={32} className="text-white" />
                        </div>
                        <p className="text-sm md:text-lg text-stone-300">Welcome to <span className="text-red-500 font-black">AADISH ROULETTE</span></p>
                        <p className="text-xs md:text-sm text-stone-500 mt-1">A deadly game of chance and strategy</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <InfoCard icon={<Target size={16} />} title="OBJECTIVE" color="border-red-600">
                                Survive by depleting your opponent's health to zero before they do the same to you. Simple, brutal, deadly.
                            </InfoCard>
                        </div>

                        <InfoCard icon={<CircleDot size={16} />} title="THE SHOTGUN" color="border-amber-500">
                            The shotgun is loaded with <span className="text-red-500 font-bold">LIVE</span> and <span className="text-blue-400 font-bold">BLANK</span> shells. You'll see the count of each before your turn.
                        </InfoCard>

                        <InfoCard icon={<Crosshair size={16} />} title="YOUR TURN" color="border-blue-500">
                            Pick up the gun and choose:<br />
                            • <span className="text-red-400 font-bold">SHOOT OPPONENT</span> - 1 damage if LIVE<br />
                            • <span className="text-yellow-400 font-bold">SHOOT SELF</span> - BLANK = extra turn!
                        </InfoCard>

                        <InfoCard icon={<Shield size={16} />} title="ITEMS" color="border-green-500">
                            Use items before shooting to gain an advantage! Items can reveal shells, heal you, skip turns, and more.
                        </InfoCard>

                        <InfoCard icon={<Heart size={16} />} title="WINNING" color="border-purple-500">
                            Reduce opponent's health to zero to win. Sawed shotgun deals 2 damage. Strategy is everything!
                        </InfoCard>
                    </div>
                </div>
            )
        },

        // Page 2: Items - Part 1
        {
            title: "ITEMS (1/2)",
            icon: <Scale size={20} className="text-cyan-400" />,
            content: (
                <div className="space-y-3">
                    <p className="text-stone-400 text-center text-xs md:text-sm mb-4">
                        🎯 Use items <span className="text-amber-400 font-bold">before shooting</span> for strategic advantage!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ItemCard
                            icon={<Eye size={20} />}
                            name="MAGNIFYING GLASS"
                            description="Reveals the current shell type in the chamber."
                            color="text-cyan-400"
                            effect="→ REVEALS LIVE/BLANK"
                        />

                        <ItemCard
                            icon={<Beer size={20} />}
                            name="BEER"
                            description="Racks the shotgun to eject the current shell without firing."
                            color="text-amber-500"
                            effect="→ EJECTS SHELL"
                        />

                        <ItemCard
                            icon={<Cigarette size={20} />}
                            name="CIGARETTES"
                            description="Light up to restore 1 health point (up to maximum)."
                            color="text-red-400"
                            effect="→ +1 HP"
                        />

                        <ItemCard
                            icon={<Link size={20} />}
                            name="HANDCUFFS"
                            description="Restrains your opponent, forcing them to skip their next turn."
                            color="text-stone-400"
                            effect="→ SKIP ENEMY TURN"
                        />

                        <ItemCard
                            icon={<Scissors size={20} />}
                            name="HAND SAW"
                            description="Saws off the shotgun barrel, DOUBLING damage."
                            color="text-orange-500"
                            effect="→ 2X DAMAGE"
                        />

                        <ItemCard
                            icon={<Smartphone size={20} />}
                            name="BURNER PHONE"
                            description="Mysterious caller reveals a random future shell position."
                            color="text-blue-300"
                            effect="→ REVEALS FUTURE SHELL"
                        />
                    </div>
                </div>
            )
        },

        // Page 3: Items - Part 2
        {
            title: "ITEMS (2/2)",
            icon: <Zap size={20} className="text-pink-500" />,
            content: (
                <div className="space-y-3">
                    <p className="text-stone-400 text-center text-xs md:text-sm mb-4">
                        ⚡ Advanced items that can <span className="text-red-400 font-bold">turn the tide</span> of battle!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ItemCard
                            icon={<RefreshCw size={20} />}
                            name="POLARITY INVERTER"
                            description="Swaps the current shell: LIVE becomes BLANK and vice-versa."
                            color="text-green-400"
                            effect="→ INVERTS CURRENT"
                        />

                        <ItemCard
                            icon={<Zap size={20} />}
                            name="ADRENALINE"
                            description="Steals an item from your opponent's inventory and uses it immediately."
                            color="text-pink-500"
                            effect="→ STEAL & USE"
                        />

                        <ItemCard
                            icon={<Icons.Choke size={20} />}
                            name="CHOKE MOD"
                            description="Fires 2 shots at once (current + next). Both LIVE = 2 DMG. One LIVE = 1 DMG. Both BLANK = 0 DMG."
                            color="text-yellow-700"
                            effect="→ DOUBLE FIRE"
                        />

                        <ItemCard
                            icon={<Icons.BigInverter size={20} />}
                            name="BIG INVERTER"
                            description="Inverts the polarity of ALL remaining shells in the magazine."
                            color="text-orange-500"
                            effect="→ INVERTS ALL"
                        />

                        <ItemCard
                            icon={<Icons.Remote size={20} />}
                            name="REMOTE"
                            description="Reverses the turn order. The previous player takes the next turn! (Multiplayer Only)."
                            color="text-red-600"
                            effect="→ REVERSE TURN ORDER"
                        />
                    </div>
                </div>
            )
        },

        // Page 4: Settings Menu
        {
            title: "SETTINGS",
            icon: <Settings size={20} className="text-stone-400" />,
            content: (
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 bg-gradient-to-br from-stone-700 to-stone-900 rounded-full flex items-center justify-center border border-stone-600">
                            <Settings size={24} className="text-stone-300" />
                        </div>
                        <p className="text-sm md:text-base text-stone-300">Customize your experience</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-stone-900/60 border border-stone-700 p-3 md:p-4 rounded-sm flex gap-3 items-start">
                            <Monitor size={20} className="text-stone-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-stone-200 text-sm md:text-base mb-1">RENDER RESOLUTION</h3>
                                <p className="text-stone-400 text-xs md:text-sm">
                                    Adjust 3D rendering quality. Lower = better performance on weak devices.
                                </p>
                            </div>
                        </div>

                        <div className="bg-stone-900/60 border border-stone-700 p-3 md:p-4 rounded-sm flex gap-3 items-start">
                            <Maximize size={20} className="text-stone-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-stone-200 text-sm md:text-base mb-1">HUD SCALE</h3>
                                <p className="text-stone-400 text-xs md:text-sm">
                                    Scale UI elements. Increase for small screens, decrease for immersion.
                                </p>
                            </div>
                        </div>

                        <div className="bg-stone-900/60 border border-stone-700 p-3 md:p-4 rounded-sm flex gap-3 items-start">
                            <Eye size={20} className="text-stone-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-stone-200 text-sm md:text-base mb-1">FIELD OF VIEW (FOV)</h3>
                                <p className="text-stone-400 text-xs md:text-sm">
                                    Wide/narrow view angle. Higher = more visible area, may stretch edges.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-950/30 to-transparent border border-amber-900/30 p-3 md:p-4 rounded-sm">
                        <p className="text-amber-400 text-xs md:text-sm font-bold flex items-center gap-2">
                            <Smartphone size={16} /> TIP: Play in FULLSCREEN + LANDSCAPE for best experience!
                        </p>
                    </div>
                </div>
            )
        },

        // Page 5: Multiplayer
        {
            title: "MULTIPLAYER",
            icon: <Users size={20} className="text-blue-500" />,
            content: (
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-blue-900 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <Users size={24} className="text-white" />
                        </div>
                        <p className="text-sm md:text-base text-stone-300">Play against real opponents online!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InfoCard icon={<Users size={14} />} title="JOINING" color="border-blue-500">
                            Enter name and click MULTIPLAYER to connect. Placed in a lobby with other players.
                        </InfoCard>

                        <InfoCard icon={<Settings size={14} />} title="LOBBY" color="border-green-500">
                            See connected players, chat, and wait for ready. Host configures match settings.
                        </InfoCard>

                        <InfoCard icon={<Shield size={14} />} title="HOST CONTROLS" color="border-amber-500">
                            First player = host. Set rounds to win, max items per player, and starting health.
                        </InfoCard>

                        <InfoCard icon={<Target size={14} />} title="READY UP" color="border-purple-500">
                            All players must mark READY before host can start. Once ready, the game begins!
                        </InfoCard>
                    </div>

                    <div className="bg-gradient-to-r from-blue-950/30 to-transparent border border-blue-900/30 p-3 rounded-sm">
                        <p className="text-blue-400 text-xs md:text-sm">
                            💬 Use in-game chat to communicate with opponents!
                        </p>
                    </div>
                </div>
            )
        },

        // Page 6: Developer Info
        {
            title: "DEVELOPER",
            icon: <Code size={20} className="text-red-500" />,
            content: (
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-full flex items-center justify-center shadow-xl shadow-red-900/50 border-2 border-red-500/30">
                            <Code size={36} className="text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-stone-100 mb-1">AADISH</h2>
                        <p className="text-stone-500 text-xs md:text-sm">Creator & Developer</p>
                    </div>

                    <div className="bg-gradient-to-br from-stone-900/80 to-stone-950 border border-stone-700/50 p-4 md:p-5 rounded-sm">
                        <p className="text-stone-300 text-center text-xs md:text-sm mb-5 leading-relaxed">
                            Thanks for playing <span className="text-red-500 font-bold">AADISH ROULETTE</span>!
                            <br />Built with ❤️ as a web-based reimagining of the deadly shotgun game.
                        </p>

                        <div className="space-y-3">
                            <a
                                href="https://github.com/AadishY"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 md:gap-4 bg-stone-800/80 border border-stone-600 p-3 md:p-4 hover:bg-stone-700 hover:border-stone-400 transition-all group rounded-sm"
                            >
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#24292e] border border-stone-500 flex items-center justify-center group-hover:border-white transition-colors rounded-sm">
                                    <Github size={20} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white tracking-wider text-sm md:text-base">GITHUB</h4>
                                    <p className="text-stone-400 text-xs md:text-sm truncate">github.com/AadishY</p>
                                </div>
                                <ChevronRight size={18} className="text-stone-500 group-hover:text-white transition-colors shrink-0" />
                            </a>

                            <a
                                href="https://www.instagram.com/yo.akatsuki/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 md:gap-4 bg-stone-800/80 border border-stone-600 p-3 md:p-4 hover:bg-gradient-to-r hover:from-purple-900/40 hover:to-pink-900/40 hover:border-pink-500 transition-all group rounded-sm"
                            >
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center rounded-sm">
                                    <Instagram size={20} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white tracking-wider text-sm md:text-base">INSTAGRAM</h4>
                                    <p className="text-stone-400 text-xs md:text-sm truncate">@yo.akatsuki</p>
                                </div>
                                <ChevronRight size={18} className="text-stone-500 group-hover:text-pink-400 transition-colors shrink-0" />
                            </a>
                        </div>

                        <div className="mt-5 pt-4 border-t border-stone-800 text-center">
                            <p className="text-stone-600 text-[10px] md:text-xs font-mono">
                                AADISH ROULETTE v{GAME_VERSION} • REACT + THREE.JS
                            </p>
                            <p className="text-stone-700 text-[10px] md:text-xs font-mono mt-1">
                                © 2024 AADISH NETWORKS
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (index: number) => {
        setCurrentPage(index);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-1 md:p-4">
            <div
                className="w-full max-w-6xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700/50 shadow-2xl shadow-black/50 relative flex flex-col h-[95vh] md:h-[90vh] md:max-h-[90vh] rounded-sm overflow-hidden origin-center transition-transform duration-100"
                style={{ transform: `scale(${scale})` }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >

                {/* Header */}
                <div className="flex justify-between items-center p-3 md:p-5 border-b border-stone-800 bg-stone-900/80 shrink-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        {pages[currentPage].icon}
                        <h2 className="text-base md:text-xl font-black text-stone-200 tracking-widest">
                            {pages[currentPage].title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-white hover:bg-red-600 transition-all p-1.5 md:p-2 rounded-sm"
                        aria-label="Close guide"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 md:p-5 overscroll-contain">
                    {pages[currentPage].content}
                </div>

                {/* Footer - Navigation */}
                {/* Footer - Navigation - Compacted */}
                <div className="shrink-0 p-2 border-t border-stone-800 bg-stone-900/95">
                    {/* Combined Navigation & Indicators */}
                    <div className="flex flex-col gap-1.5">
                        {/* Page Indicators */}
                        <div className="flex justify-center gap-1">
                            {pages.map((page, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToPage(index)}
                                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${index === currentPage
                                        ? 'bg-red-500 scale-110 shadow-sm shadow-red-500/50'
                                        : 'bg-stone-700 hover:bg-stone-500'
                                        }`}
                                    aria-label={`Go to page ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Buttons & Counter */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 0}
                                className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 font-bold tracking-wider transition-all text-xs rounded-sm ${currentPage === 0
                                    ? 'text-stone-700 cursor-not-allowed hidden' // Hide if disabled to save visual clutter? Or just dim. Let's keep dim but small.
                                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                    } ${currentPage === 0 ? 'opacity-0' : 'opacity-100'}`} // Use opacity to scale checks layout
                            >
                                <ChevronLeft size={14} />
                                <span>PREV</span>
                            </button>

                            <span className="text-stone-600 font-mono text-[10px]">
                                {currentPage + 1} / {pages.length}
                            </span>

                            <button
                                onClick={nextPage}
                                disabled={currentPage === pages.length - 1}
                                className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 font-bold tracking-wider transition-all text-xs rounded-sm ${currentPage === pages.length - 1
                                    ? 'text-stone-700 cursor-not-allowed opacity-0'
                                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                    }`}
                            >
                                <span>NEXT</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
