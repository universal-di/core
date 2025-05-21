export class InvalidModuleConfigError extends Error {
    constructor(property) {
        super(`Invalid property '${property}' passed into the @DIModule() decorator.`);
    }
}
