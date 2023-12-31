import {DIContainer} from '../di-container/di-container';
import {InjectionToken, Token} from '../models';

export class Injector extends DIContainer {
    constructor(private readonly _parentInjector: Injector | null = null) {
        super();

        this._trySetParentProviders();
    }

    get<T>(type: Token<T> | InjectionToken<T>): T {
        return this.inject(type);
    }

    protected override inject<T>(type: Token<T>): T {
        if (!this._hasProvider(type) && this._hasParentInjector()) {
            return this._parentInjector!.inject(type);
        }

        const provider = this._providers.get(type);

        return this._injectSingleton(type, provider);
    }

    private _trySetParentProviders(): void {
        if (!this._parentInjector) {
            return;
        }

        this._setParentProviders();
    }

    private _setParentProviders(): void {
        this._parentInjector!._providers.forEach((provider, token) => {
            this._providers.set(token, provider);
            this._providersContainers.set(token, this._parentInjector!._providersContainers.get(token)!);
        });
    }

    private _hasParentInjector(): boolean {
        return !!this._parentInjector && this._parentInjector instanceof Injector;
    }

    private _hasProvider<T>(type: Token<T>): boolean {
        return !!this._providers.get(type);
    }
}
