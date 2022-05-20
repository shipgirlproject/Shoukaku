import Websocket from 'ws';
import { Node } from './Node';

export class Queue {
    private readonly node: Node;
    public readonly pending: string[];
    constructor(node: Node) {
        this.node = node;
        this.pending = [];
    }

    public add(data: any, important = false): void {
        this.pending[important ? 'unshift' : 'push'](JSON.stringify(data));
        if (this.node.ws?.readyState === Websocket.OPEN) this.process();
    }

    protected process(): void {
        if (!this.node.ws || !this.pending.length) return;
        while(this.pending.length) {
            const message = this.pending.shift();
            if (!message) return;
            this.node.ws.send(message, error => {
                if (!error) return;
                this.node.emit('error', this.node.name, error);
            });
        }
    }

    protected clear(): void {
        this.pending.length = 0;
    }
}