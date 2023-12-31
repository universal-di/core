import 'reflect-metadata';
import {Class} from '../types';
import {isArray, isClassProvider, isDefined, isValueProvider} from '../utils';
import {getInjectionToken} from '../decorators';
import {NoProviderForTypeError} from '../errors';
import {ClassProvider, InjectableParam, Provider, Token, ValueProvider} from '../models';
import {
    validateInjectableIfClassProvider,
    validateProviderExists,
    validateRecursiveDependencyDetected,
} from '../validators';

export class DIContainer {
    protected static REFLECT_PARAMS = 'design:paramtypes';
    protected _providers = new Map<Token<any>, Provider<any> | Provider<any>[]>();
    protected _providersContainers = new WeakMap<Token<any>, DIContainer>();
    protected _cache = new WeakMap<Token<any>, any>();

    addProvider<T>(provider: Provider<T>, container: DIContainer = this): void {
        validateInjectableIfClassProvider(provider);

        const providerKey = provider['provide'] || provider;

        this._providersContainers.set(providerKey, container);

        if (!provider['multi']) {
            this._providers.set(providerKey, provider);
            return;
        }

        this._providers.set(
            providerKey,
            this._providers.has(providerKey)
                ? [...(this._providers.get(providerKey) as Provider<any>[]), provider]
                : [provider],
        );
    }

    protected inject<T>(type: Token<T>): T {
        const provider = this._providers.get(type);

        return this._injectSingleton(type, provider);
    }

    protected _injectSingleton<T>(type: Token<T>, provider?: Provider<T> | Provider<T>[]): T | T[] {
        validateProviderExists(type, provider);

        return (this._providersContainers.get(type) as DIContainer)._injectWithProvider(type, provider);
    }

    protected _injectWithProvider<T>(type: Token<T>, provider?: Provider<T> | Provider<T>[]): T | T[] {
        validateProviderExists(type, provider);

        const cached = this._getCached(provider);
        if (cached) {
            return cached;
        }

        if (isClassProvider(provider)) {
            return this._injectClass(provider as ClassProvider<T>);
        }

        if (isValueProvider(provider)) {
            return this._injectValue(provider as ValueProvider<T> | ValueProvider<T>[]);
        }

        return this._injectClassToken(provider as Class<T> | Class<T>[]);
    }

    protected _injectValue<T>(_provider: ValueProvider<T> | ValueProvider<T>[]): T | T[] {
        const provider = isArray(_provider) ? _provider[0] : _provider;
        const providerValue = isArray(_provider)
            ? (_provider as ValueProvider<T>[]).map(p => p.useValue)
            : (_provider as ValueProvider<T>).useValue;

        this._cacheDependency(provider, providerValue);

        return providerValue;
    }

    protected _injectClassToken<T>(_provider: Class<T> | Class<T>[]): T | T[] {
        const constructClassProvider = (provider: Class<T>): T => {
            const params = this._getInjectedParamsValues(provider);
            return Reflect.construct(provider, params);
        };
        const target = isArray(_provider) ? _provider[0] : _provider;
        const providerValue = isArray(_provider)
            ? (_provider as Class<T>[]).map(p => constructClassProvider(p))
            : constructClassProvider(target);

        this._cacheDependency(target, providerValue);

        return providerValue;
    }

    protected _injectClass<T>(_provider: ClassProvider<T> | ClassProvider<T>[]): T | T[] {
        const constructClassProvider = (provider: ClassProvider<T>): T => {
            const params = this._getInjectedParamsValues(provider.useClass);
            return Reflect.construct(provider.useClass, params);
        };
        const provider = isArray(_provider) ? _provider[0] : _provider;
        const providerValue = isArray(_provider)
            ? (_provider as ClassProvider<T>[]).map(p => constructClassProvider(p))
            : constructClassProvider(_provider as ClassProvider<T>);

        this._cacheDependency(provider, providerValue);

        return providerValue;
    }

    protected _getInjectedParamsValues<T>(target: Class<T>): any[] {
        const injectedParamsTypes = Reflect.getMetadata(DIContainer.REFLECT_PARAMS, target) as (
            | InjectableParam
            | undefined
            )[];

        if (!isDefined(injectedParamsTypes)) {
            return [];
        }

        return injectedParamsTypes.map((defaultInjectionToken, index) => {
            validateRecursiveDependencyDetected(defaultInjectionToken, target, index);

            const tryOverrideNotClassInjectionToken = () => {
                const overriddenInjectionToken = getInjectionToken(target, index);
                return isDefined(overriddenInjectionToken) ? overriddenInjectionToken : defaultInjectionToken;
            };

            const actualInjectedToken = tryOverrideNotClassInjectionToken()!;

            if (!this._providers.has(actualInjectedToken)) {
                throw new NoProviderForTypeError(actualInjectedToken, target);
            }

            return this.inject(actualInjectedToken);
        });
    }

    protected _cacheDependency<T>(provider: Provider<T>, value: any): void {
        const providerKey = provider['provide'] || provider;
        this._cache.set(providerKey, value);
    }

    protected _getCached<T>(_provider: Provider<T> | Provider<T>[]): any {
        const provider = isArray(_provider) ? _provider[0] : _provider;
        const providerKey = provider['provide'] || provider;

        return this._cache.get(providerKey);
    }
}
