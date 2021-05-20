class ShoukakuQueue {
    constructor(socket) {
        this.socket = socket;
        this.queue = [];
    }

    send(string, important = false) {
        this.queue[important ? 'unshift' : 'push'](string);
        if (this.socket.ws?.readyState === 1) this.process();
    }

    process() {
        if (!this.queue.length) return;
        while (this.queue.length > 0) 
            this.socket.ws.send(this.queue.shift(), error => {
                if (error) this.socket.emit('error', this.name, error);
            });
    }
}

module.exports = ShoukakuQueue;