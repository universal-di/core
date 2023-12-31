import {InjectionToken} from '../models';
import {Class} from "../types";

const INJECT_METADATA_KEY = Symbol('DI:INJECT_KEY');

type Token<T> = Class<T> | InjectionToken<T>;

type Prototype<T> = {
    [Property in keyof T]: T[Property] extends NewableFunction ? T[Property] : T[Property] | undefined;
} & { constructor: NewableFunction };

interface ConstructorFunction<T = Record<string, unknown>> {
    new(...args: unknown[]): T;

    prototype: Prototype<T>;
}

type DecoratorTarget<T = unknown> = ConstructorFunction<T> | Prototype<T>;

export function Inject<T>(token: Token<T>) {
    return (target: DecoratorTarget, _?: string | symbol, index?: number): any => {
        const indexData = `index-${index}`;

        Reflect.defineMetadata(INJECT_METADATA_KEY, token, target, indexData);

        return target;
    };
}

export function getInjectionToken(target: any, index: number) {
    const indexData = `index-${index}`;
    return Reflect.getMetadata(INJECT_METADATA_KEY, target, indexData) as Token<any> | undefined;
}
