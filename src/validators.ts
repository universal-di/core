import {isInjectable} from './decorators';
import {NoProviderForTypeError, NotInjectableError, RecursiveDependencyDetectedError} from './errors';
import {InjectableParam, Provider, Token} from './models';
import {isClassProvider, isDefined} from './utils';
import {Class} from "./types";

export const validateInjectableIfClassProvider = <T>(provider: Provider<T>): void => {
    if (isClassProvider(provider) && !isInjectable(provider.useClass)) {
        throw new NotInjectableError(provider);
    }
};

export function validateProviderExists<T>(
    type: Token<T>,
    provider?: Provider<any> | Provider<any>[],
): asserts provider is Provider<any> | Provider<any>[] {
    if (!isDefined(provider)) {
        throw new NoProviderForTypeError(type);
    }
}

export function validateRecursiveDependencyDetected<T>(
    argType: InjectableParam | undefined,
    type: Class<T>,
    index: number,
): asserts argType is InjectableParam {
    if (!isDefined(argType)) {
        throw new RecursiveDependencyDetectedError(type, index);
    }
}
