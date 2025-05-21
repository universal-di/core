import { ClassProvider, Provider, ValueProvider } from "../models";
import { SingleOrArray, Class } from "../types.js";

export function isClassProvider<T>(
    _provider: Provider<T> | Provider<T>[]
): _provider is SingleOrArray<ClassProvider<T>> {
    const provider = Array.isArray(_provider) ? _provider[0] : _provider;
    return (provider as any).useClass !== undefined;
}

export function isValueProvider<T>(
    _provider: Provider<T> | Provider<T>[]
): _provider is SingleOrArray<ValueProvider<T>> {
    const provider = Array.isArray(_provider) ? _provider[0] : _provider;
    return (provider as any).useValue !== undefined;
}

export function isClassToken<T>(
    _provider: Provider<T> | Provider<T>[]
): _provider is Class<T> {
    return typeof _provider === "function";
}
