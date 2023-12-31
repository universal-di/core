export class ModuleAlreadyBootstrappedError extends Error {
    constructor() {
        super('Module already bootstrapped');
    }
}
