export type SocketAction = {
    type: string;
    data: any;
};

export class SocketBatcher {
    private maxBatchSize: number;
    private maxDelayMs: number;
    private callback: (actions: SocketAction[]) => void;
    private queuedActions: SocketAction[] = [];
    private timerId: number | null = null;

    constructor(maxBatchSize: number, maxDelayMs: number, callback: (actions: SocketAction[]) => void) {
        this.maxBatchSize = maxBatchSize;
        this.maxDelayMs = maxDelayMs;
        this.callback = callback;
    }

    queue(type: string, data: any) {
        this.queuedActions.push({ type, data });
        if (this.queuedActions.length >= this.maxBatchSize) {
            this.flush();
            return;
        }

        if (this.timerId === null) {
            this.timerId = window.setTimeout(() => {
                this.timerId = null;
                this.flush();
            }, this.maxDelayMs);
        }
    }

    flush() {
        if (this.queuedActions.length === 0) {
            return;
        }

        const actions = this.queuedActions.slice();
        this.queuedActions.length = 0;

        if (this.timerId !== null) {
            window.clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.callback(actions);
    }
}
