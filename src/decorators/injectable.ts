import {Class} from "../types";

const INJECTABLE_METADATA_KEY = Symbol('DI:INJECTABLE_KEY');

export function Injectable() {
    return function <T extends Class<unknown>>(target: T) {
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);

        return target;
    };
}

export function isInjectable<T>(target: Class<T>) {
    return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) === true;
}
