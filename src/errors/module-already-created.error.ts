import { Class } from "../types.js";

export class ModuleAlreadyCreatedError extends Error {
    constructor(module: Class<unknown>) {
        super(`Module ${module.name} is already created`);
    }
}
