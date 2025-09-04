export class RateLimiter {
    private capacity: number;
    private refillMs: number;
    private tokens: number;
    private queue: Array<() => void> = [];
    private lastRefill: number;

    constructor(capacity: number, refillMs: number) {
        this.capacity = capacity;
        this.refillMs = refillMs;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    setLimitPerMinute(limit: number) {
        this.capacity = Math.max(1, limit);
        this.tokens = Math.min(this.tokens, this.capacity);
    }

    private refill() {
        const now = Date.now();
        if (now - this.lastRefill >= this.refillMs) {
            this.tokens = this.capacity;
            this.lastRefill = now;
            const pending = [...this.queue];
            this.queue = [];
            for (const fn of pending) fn();
        }
    }

    acquire(): Promise<void> {
        this.refill();
        if (this.tokens > 0) {
            this.tokens -= 1;
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.queue.push(() => {
                this.tokens = Math.max(0, this.tokens - 1);
                resolve();
            });
        });
    }
}


