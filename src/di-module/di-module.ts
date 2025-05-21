import { DIContainer } from "../di-container/di-container";
import { ModuleAlreadyBootstrappedError } from "../errors/module-already-bootstrapped.error.js";
import { ProviderAddedAfterBootstrapError } from "../errors/provider-added-after-bootstrap.error.js";
import { Provider } from "../models";

export type DIModuleConfig = {
    imports?: DIModule[];
    providers?: Provider[];
    exports?: Provider[];
};

export class DIModule {
    private _injector: DIContainer;
    private _bootstrapped = false;
    private readonly _moduleConfig: Required<DIModuleConfig>;

    constructor(moduleConfig: DIModuleConfig) {
        this._moduleConfig = {
            imports: moduleConfig.imports || [],
            providers: moduleConfig.providers || [],
            exports: moduleConfig.exports || [],
        };
    }

    get injector(): DIContainer {
        return this._injector;
    }

    set injector(injector: DIContainer) {
        this._injector = injector;
    }

    get providers(): Provider[] {
        return this._moduleConfig.providers;
    }

    get exportedProviders(): Provider[] {
        return this._moduleConfig.exports;
    }

    addProvider<T>(provider: Provider<T>, injector = this.injector): void {
        if (this._bootstrapped) {
            throw new ProviderAddedAfterBootstrapError();
        }

        this.injector.addProvider(provider, injector);
    }

    bootstrap(): DIModule {
        if (this._bootstrapped) {
            throw new ModuleAlreadyBootstrappedError();
        }

        this._bootstrap();

        return this;
    }

    private get _importedProviders(): [Provider, DIContainer][] {
        return this._moduleConfig.imports.reduce(
            (memo: [Provider, DIContainer][], importedModule) => {
                return memo.concat(importedModule._exportedProviders);
            },
            []
        );
    }

    private get _exportedProviders(): [Provider, DIContainer][] {
        return this.exportedProviders.map((provider) => [
            provider,
            this._injector,
        ]);
    }

    private _bootstrap(): void {
        if (this._bootstrapped) {
            return;
        }

        this._moduleConfig.imports.forEach((importedModule) =>
            importedModule._bootstrap()
        );
        this._registerProviders();
        this._bootstrapped = true;
    }

    private _registerProviders(): void {
        const ownProviders = this._moduleConfig.providers;
        const importedProviders = this._importedProviders;

        this._injector = new DIContainer();
        ownProviders.map((provider) =>
            this.addProvider(provider, this._injector)
        );
        importedProviders.forEach(([provider, providerInjector]) =>
            this.injector.addProvider(provider, providerInjector)
        );
    }
}

export const bootstrapTestingModule = (config: DIModuleConfig) => {
    return new DIModule(config).bootstrap();
};
