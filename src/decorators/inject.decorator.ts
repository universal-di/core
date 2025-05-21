import { InjectionToken } from "../models";
import { Class } from "../types.js";

const INJECT_METADATA_KEY = Symbol("DI:INJECT_KEY");
const INJECT_FACTORY_METADATA_KEY = Symbol("DI:INJECT_FACTORY_KEY");

type Token<T> = Class<T> | InjectionToken<T>;

type Prototype<T> = {
    [Property in keyof T]: T[Property] extends NewableFunction
        ? T[Property]
        : T[Property] | undefined;
} & { constructor: NewableFunction };

interface ConstructorFunction<T = Record<string, unknown>> {
    new (...args: unknown[]): T;

    prototype: Prototype<T>;
}

type DecoratorTarget<T = unknown> = ConstructorFunction<T> | Prototype<T>;

export function Inject<T>(token: Token<T>) {
    return (
        target: DecoratorTarget,
        _?: string | symbol,
        index?: number
    ): any => {
        const indexData = `index-${index}`;

        Reflect.defineMetadata(INJECT_METADATA_KEY, token, target, indexData);

        return target;
    };
}

export function getInjectionToken(target: Class<any>, index: number) {
    const indexData = `index-${index}`;
    return Reflect.getMetadata(INJECT_METADATA_KEY, target, indexData) as
        | Token<any>
        | undefined;
}

export function InjectFactory<T>(token: Token<T>) {
    return (
        target: DecoratorTarget,
        _?: string | symbol,
        index?: number
    ): any => {
        const indexData = `index-${index}`;

        Reflect.defineMetadata(INJECT_METADATA_KEY, token, target, indexData);
        Reflect.defineMetadata(
            INJECT_FACTORY_METADATA_KEY,
            true,
            target,
            indexData
        );

        return target;
    };
}

export function isFactoryInjectionToken(target: any, index: number): boolean {
    const indexData = `index-${index}`;
    return !!Reflect.getMetadata(
        INJECT_FACTORY_METADATA_KEY,
        target,
        indexData
    );
}
