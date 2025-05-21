export class NoDiContextProvidedError extends Error {
    constructor() {
        super(`No di context provided`);
    }
}
