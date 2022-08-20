module.exports = class Queue {
    constructor(size) {
        this.items = [];
        this.pointer = -1;
        this.size = size;
        this.count = 0;
    }


    // Methods
    first() {
        return this.pointer == 0;
    }

    prequeue() {
        this.pointer -= 1;
        return this.items.at(this.pointer);
    }

    dequeue() {
        this.pointer += 1;
        return this.items.at(this.pointer);
    }

    enqueue(item) {
        // Size check
        if (this.count == this.size) {
            this.items.shift();
        } else {
            this.count += 1;
        }
        this.items.push(item);
    }
}