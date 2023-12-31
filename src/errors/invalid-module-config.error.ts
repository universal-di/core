export class InvalidModuleConfigError extends Error {
    constructor(property: string) {
        super(`Invalid property '${property}' passed into the @DIModule() decorator.`);
    }
}
