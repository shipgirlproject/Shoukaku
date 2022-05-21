import Websocket from 'ws';
import { Node } from './Node';

export class Queue {
    private readonly node: Node;
    public readonly pending: string[];
    private flushes: number;
    constructor(node: Node) {
        this.node = node;
        this.pending = [];
        this.flushes = 0;
    }

    public add(data?: any, important = false): void {
        if (data) this.pending[important ? 'unshift' : 'push'](JSON.stringify(data));
        this.process();
    }

    public clear(): void {
        this.pending.length = 0;
    }

    public flush(code: number, reason?: string): void {
        if (!this.pending.length || this.flushes > 10) {
            this.flushes = 0;
            this.clear();
            this.node.ws?.close(code, reason);
            return;
        }
        this.flushes++;
        setTimeout(() => this.flush(code, reason), 1000);
    }

    protected process(): void {
        if (!this.node.ws || this.node.ws.readyState !== Websocket.OPEN || !this.pending.length) return;
        while(this.pending.length) {
            const message = this.pending.shift();
            if (!message) return;
            this.node.ws.send(message, error => {
                if (!error) return;
                this.node.emit('error', this.node.name, error);
            });
        }
    }
}
