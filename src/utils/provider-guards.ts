import {ClassProvider, Provider, ValueProvider} from '../models';
import {isArray} from "../utils";

export function isClassProvider<T>(_provider: Provider<T> | Provider<T>[]): _provider is ClassProvider<T> {
    const provider = isArray(_provider) ? _provider[0] : _provider;
    return (provider as any).useClass !== undefined;
}

export function isValueProvider<T>(_provider: Provider<T> | Provider<T>[]): _provider is ValueProvider<T> {
    const provider = isArray(_provider) ? _provider[0] : _provider;
    return (provider as any).useValue !== undefined;
}
