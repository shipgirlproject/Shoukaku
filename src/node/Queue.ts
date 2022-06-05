import Websocket from 'ws';
import { Node } from './Node';

/**
 * Represents a message queue
 * @internal
 */
export class Queue {
    /**
     * Node that initalized this message queue
     */
    private readonly node: Node;
    /**
     * Pending messages
     */
    public readonly pending: string[];
    /**
     * Number of flushes in this queue
     */
    private flushes: number;
    /**
     * @param node An instance of Node
     */
    constructor(node: Node) {
        this.node = node;
        this.pending = [];
        this.flushes = 0;
    }

    /**
     * Add data to queue
     * @param data Message data
     * @param important Priority status
     * @internal
     */
    public add(data?: any, important = false): void {
        if (data) this.pending[important ? 'unshift' : 'push'](JSON.stringify(data));
        this.process();
    }

    /**
     * Clear the queue
     * @internal
     */
    public clear(): void {
        this.pending.length = 0;
    }

    /**
     * Flush the ws connections in queue
     * @param code Status code
     * @param reason Reason for close
     * @internal
     */
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

    /**
     * Process messages in the queue
     * @internal
     */
    protected process(): void {
        if (!this.node.ws || this.node.ws.readyState !== Websocket.OPEN || !this.pending.length) return;
        while(this.pending.length) {
            const message = this.pending.shift();
            if (!message) return;
            this.node.ws.send(message);
        }
    }
}
