import { Class } from "../types.js";

export class RecursiveDependencyDetectedError<T> extends Error {
    constructor(type: Class<T>, index: number) {
        super(
            `Injection error. Recursive dependency detected in constructor for type ${type.name} with parameter at index ${index}.`
        );
    }
}
