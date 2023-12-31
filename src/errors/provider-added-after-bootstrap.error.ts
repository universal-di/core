export class ProviderAddedAfterBootstrapError extends Error {
    constructor() {
        super('Cannot add providers after module has been bootstrapped');
    }
}
