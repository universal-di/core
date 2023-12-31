import {ClassProvider, InjectionToken, Provider, Token, ValueProvider} from "./models";

export const isArray = Array.isArray;

export const isDefined = (value: any): boolean => value !== undefined;

export const isClassProvider = <T>(_provider: Provider<T> | Provider<T>[]): _provider is ClassProvider<T> => {
    const provider = isArray(_provider) ? _provider[0] : _provider;
    return (provider as ClassProvider<T>).useClass !== undefined;
}

export const isValueProvider = <T>(_provider: Provider<T> | Provider<T>[]): _provider is ValueProvider<T> => {
    const provider = isArray(_provider) ? _provider[0] : _provider;
    return (provider as ValueProvider<T>).useValue !== undefined;
}

export const getTokenName = <T>(token: Token<T>): string => {
    return token instanceof InjectionToken ? token.identifier : token.name;
}
