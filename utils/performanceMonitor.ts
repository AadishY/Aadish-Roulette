type PerformanceMonitorState = {
    lastTime: number;
    frameCount: number;
    averageFps: number;
};

const state: PerformanceMonitorState = {
    lastTime: performance.now(),
    frameCount: 0,
    averageFps: 60,
};

export const performanceMonitor = {
    updateFrame() {
        const now = performance.now();
        state.frameCount += 1;
        const delta = now - state.lastTime;
        if (delta >= 1000) {
            state.averageFps = Math.round((state.frameCount * 1000) / delta);
            state.frameCount = 0;
            state.lastTime = now;
        }
    },
    getFps() {
        return state.averageFps;
    },
};
