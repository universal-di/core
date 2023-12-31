import {Class} from "../types";

export class RecursiveDependencyDetectedError<T> extends Error {
    constructor(type: Class<T>, index: number) {
        super(
            `Injection error. Recursive dependency detected in constructor for type ${type.name} with parameter at index ${index}.`,
        );
    }
}
