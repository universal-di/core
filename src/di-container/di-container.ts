import "reflect-metadata";
import { getInjectionToken, isFactoryInjectionToken } from "../decorators";
import {
    ClassProvider,
    Factory,
    InjectableParam,
    Provider,
    Token,
    ValueProvider,
} from "../models";
import { first, isClassProvider, isDefined, isValueProvider } from "../utils";
import {
    validateInjectableIfClassProvider,
    validateProviderExists,
    validateRecursiveDependencyDetected,
    validateSingleClassToken,
} from "../validators";
import { NoProviderForTypeError } from "../errors/no-provider-for-type.error.js";
import { Class, SingleOrArray } from "../types.js";

export class DIContainer {
    protected static REFLECT_PARAMS = "design:paramtypes";
    protected _providers = new Map<
        Token<any>,
        Provider<any> | Provider<any>[]
    >();
    protected _providersContainers = new WeakMap<Token<any>, DIContainer>();
    protected _multiProvidersContainers = new WeakMap<
        Token<any>,
        Map<DIContainer, Provider<any>[]>
    >();
    protected _cache = new WeakMap<Token<any>, any>();

    get<T>(type: Token<T>, shouldInjectFactory = false): T {
        return this.injectSingletonOrFactory(type, shouldInjectFactory) as T;
    }

    addProvider<T>(provider: Provider<T>, container: DIContainer = this): void {
        validateInjectableIfClassProvider(provider);

        const providerKey = provider["provide"] || provider;

        if (!provider["multi"]) {
            this._providersContainers.set(providerKey, container);
            this._providers.set(providerKey, provider);
            return;
        }

        this._providers.set(
            providerKey,
            this._providers.has(providerKey)
                ? [
                      ...(this._providers.get(providerKey) as Provider<any>[]),
                      provider,
                  ]
                : [provider]
        );

        if (!this._multiProvidersContainers.has(providerKey)) {
            this._multiProvidersContainers.set(
                providerKey,
                new Map([[container, [provider]]])
            );
            return;
        }

        const oldProviders = [
            ...(this._multiProvidersContainers
                .get(providerKey)!
                .get(container) || []),
        ];
        this._multiProvidersContainers
            .get(providerKey)!
            .set(container, [...oldProviders, provider]);
    }

    protected injectSingletonOrFactory<T>(
        type: Token<T>,
        shouldInjectFactory = false
    ): T | T[] | Factory<T> {
        const provider = this._providers.get(type);
        validateProviderExists(type, provider);

        if (shouldInjectFactory) {
            return this._injectFactory(type, provider);
        }

        return this._injectSingleton(type, provider);
    }

    private _injectFactory<T>(
        type: Token<T>,
        provider: Class<T> | Provider<T> | Provider<T>[]
    ): Factory<T> {
        validateSingleClassToken(type, provider);

        return (): T => this._constructClassProvider(provider);
    }

    private _injectSingleton<T>(
        token: Token<T>,
        provider: SingleOrArray<Provider<T>>
    ): T | T[] {
        if (this._multiProvidersContainers.has(token)) {
            const containers = [...this._multiProvidersContainers.get(token)!];

            return containers.reduce((memo: T[], [container, providers]) => {
                return memo.concat(
                    container._injectWithProvider(token, providers)
                );
            }, []);
        }

        return (
            this._providersContainers.get(token) as DIContainer
        )._injectWithProvider(token, provider);
    }

    private _injectWithProvider<T>(
        type: Token<T>,
        provider?: SingleOrArray<Provider<T>>
    ): T | T[] {
        validateProviderExists(type, provider);

        const cached: SingleOrArray<T> = this._getCached(
            first<Provider<T>>(provider)
        );
        if (cached) {
            return cached;
        }

        if (isClassProvider(provider)) {
            return this._injectClass(provider);
        }

        if (isValueProvider(provider)) {
            return this._injectValue(provider);
        }

        return this._injectClassToken(provider as SingleOrArray<Class<T>>);
    }

    private _injectValue<T>(
        provider: SingleOrArray<ValueProvider<T>>
    ): T | T[] {
        const useValue = (p: ValueProvider<T>): T => p.useValue;

        return this._getProviderValue(provider, useValue);
    }

    private _injectClass<T>(
        provider: SingleOrArray<ClassProvider<T>>
    ): T | T[] {
        const useClass = (p: ClassProvider<T>): T =>
            this._constructClassProvider(p.useClass);

        return this._getProviderValue(provider, useClass);
    }

    private _injectClassToken<T>(provider: SingleOrArray<Class<T>>): T | T[] {
        const useClassToken = (p: Class<T>): T =>
            this._constructClassProvider(p);

        return this._getProviderValue(provider, useClassToken);
    }

    private _getProviderValue<K extends Provider<T>, T>(
        provider: SingleOrArray<K>,
        getValue: (p: K) => T
    ): T | T[] {
        const providerValue = Array.isArray(provider)
            ? provider.map(getValue)
            : getValue(provider);

        this._cacheDependency(first(provider), providerValue);

        return providerValue;
    }

    private _getInjectedParamsValues<T>(target: Class<T>): any[] {
        const injectedParamsTypes = Reflect.getMetadata(
            DIContainer.REFLECT_PARAMS,
            target
        ) as (InjectableParam | undefined)[];

        if (!isDefined(injectedParamsTypes)) {
            return [];
        }

        return injectedParamsTypes.map((defaultInjectionToken, index) => {
            validateRecursiveDependencyDetected(
                defaultInjectionToken,
                target,
                index
            );

            const tryOverrideNotClassInjectionToken = () => {
                const overriddenInjectionToken = getInjectionToken(
                    target,
                    index
                );
                return isDefined(overriddenInjectionToken)
                    ? overriddenInjectionToken
                    : defaultInjectionToken;
            };

            const actualInjectedToken = tryOverrideNotClassInjectionToken();
            const shouldInjectFactory = isFactoryInjectionToken(target, index);

            if (!this._providers.has(actualInjectedToken)) {
                throw new NoProviderForTypeError(actualInjectedToken, target);
            }

            return this.get(actualInjectedToken, shouldInjectFactory);
        });
    }

    private _cacheDependency<T>(provider: Provider<T>, value: T): void {
        const providerKey = provider["provide"] || provider;
        this._cache.set(providerKey, value);
    }

    private _getCached<T>(provider: Provider<T>): T | T[] {
        const providerKey = provider["provide"] || provider;
        return this._cache.get(providerKey);
    }

    private _constructClassProvider<T>(provider: Class<T>): T {
        const params = this._getInjectedParamsValues(provider);
        return Reflect.construct(provider, params);
    }
}
