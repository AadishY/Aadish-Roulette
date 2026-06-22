import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface LinkPreviewData {
    title: string;
    description: string;
    image: string;
    siteName: string;
}

interface LinkPreviewCardProps {
    url: string;
}

// Global cache to prevent redundant HTTP requests when rendering multiple instances of the same URL
const previewCache: Record<string, LinkPreviewData | null> = {};

const params = new URLSearchParams(window.location.search);
const isDiscord = params.has('frame_id') || params.has('instance_id') || window.location.search.includes('platform=') || window.location.hostname.includes('discordsays.com');
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
    (isDiscord ? window.location.origin : 'https://yoakatsuki-buckshot.hf.space');

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url }) => {
    const [data, setData] = useState<LinkPreviewData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!url) return;

        // Check cache first
        if (previewCache[url] !== undefined) {
            setData(previewCache[url]);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchPreview = async () => {
            try {
                const res = await fetch(`${SERVER_URL}/api/link-preview?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Preview fetch failed');
                const json = await res.json();
                
                if (isMounted) {
                    // Only cache valid previews with titles
                    if (json && json.title) {
                        previewCache[url] = json;
                        setData(json);
                    } else {
                        previewCache[url] = null;
                        setData(null);
                    }
                }
            } catch (err) {
                console.warn("Failed to extract link details:", err);
                if (isMounted) {
                    previewCache[url] = null;
                    setData(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPreview();

        return () => {
            isMounted = false;
        };
    }, [url]);

    if (loading) {
        return (
            <div className="mt-2 p-3 bg-stone-950 border border-stone-900 rounded-xl flex items-center gap-2 max-w-sm select-none">
                <Loader2 size={12} className="animate-spin text-cyan-500" />
                <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">FETCHING DATA PREVIEW...</span>
            </div>
        );
    }

    if (!data || !data.title) return null;

    return (
        <div className="mt-2.5 max-w-md w-full bg-stone-900/60 border border-stone-850 rounded-xl overflow-hidden shadow-xl text-left select-none animate-in fade-in zoom-in-95 duration-200 hover:border-cyan-500/25 transition-all flex flex-col relative group">
            {/* Cyberpunk left border indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />

            <div className="p-3.5 pl-4 flex flex-col gap-1.5 font-sans">
                {/* Site Header Name */}
                {data.siteName && (
                    <span className="text-[8px] font-mono text-stone-500 font-black tracking-widest uppercase">
                        {data.siteName}
                    </span>
                )}

                {/* Title */}
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] sm:text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline leading-snug flex items-center gap-1 cursor-pointer select-text"
                >
                    {data.title}
                    <ExternalLink size={10} className="inline opacity-50 shrink-0" />
                </a>

                {/* Description */}
                {data.description && (
                    <p className="text-[10px] text-stone-400 leading-normal font-medium select-text break-words">
                        {data.description}
                    </p>
                )}

                {/* Image */}
                {data.image && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-stone-800 bg-stone-950 flex items-center justify-center relative max-h-48 group-hover:border-stone-700 transition-colors">
                        <img 
                            src={data.image} 
                            alt={data.title} 
                            className="w-full h-full object-cover object-center max-h-48 select-none"
                            loading="lazy"
                            onError={(e) => {
                                // Hide broken images gracefully
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
