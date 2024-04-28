export class AsyncLock {
    public promise: Promise<unknown>;

    constructor() {
        this.promise = Promise.resolve();
    }

    public disable = (_: unknown) => {};

    public enable() {
        this.promise = new Promise((resolve) => (this.disable = resolve));
    }
}
