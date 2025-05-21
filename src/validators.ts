import { isInjectable } from "./decorators";
import { NoProviderForTypeError } from "./errors/no-provider-for-type.error.js";
import { NotInjectableError } from "./errors/not-injectable.error.js";
import { RecursiveDependencyDetectedError } from "./errors/recursive-dependency-detected.error.js";
import { SingleClassTokenRequiredError } from "./errors/single-class-token-required.error";
import { InjectableParam, Provider, Token } from "./models";
import { Class } from "./types.js";
import { isClassProvider, isDefined } from "./utils.js";
import { isClassToken } from "./utils/provider-guards.js";

export const validateInjectableIfClassProvider = <T>(
    provider: Provider<T>
): void => {
    if (isClassProvider(provider) && !isInjectable(provider.useClass)) {
        throw new NotInjectableError(provider);
    }
};

export function validateProviderExists<T>(
    type: Token<T>,
    provider?: Provider<any> | Provider<any>[]
): asserts provider is Provider<any> | Provider<any>[] {
    if (!isDefined(provider)) {
        throw new NoProviderForTypeError(type);
    }
}

export function validateSingleClassToken<T>(
    type: Token<T>,
    provider: Provider<any> | Provider<any>[]
): asserts provider is Class<any> {
    if (!isClassToken(provider)) {
        throw new SingleClassTokenRequiredError(type);
    }
}

export function validateRecursiveDependencyDetected<T>(
    argType: InjectableParam | undefined,
    type: Class<T>,
    index: number
): asserts argType is InjectableParam {
    if (!isDefined(argType)) {
        throw new RecursiveDependencyDetectedError(type, index);
    }
}
