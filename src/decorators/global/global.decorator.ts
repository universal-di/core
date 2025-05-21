import { Class } from "../../types.js";

export const DI_GLOBAL_METADATA_KEY = Symbol("DI:GLOBAL_METADATA_KEY");

// tested in di-application.spec.ts
export function Global(): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(DI_GLOBAL_METADATA_KEY, true, target);
    };
}

export function isGlobalModule<T>(target: Class<T>): boolean {
    return Reflect.getMetadata(DI_GLOBAL_METADATA_KEY, target) === true;
}
