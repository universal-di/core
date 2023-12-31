import {ModuleAlreadyBootstrappedError, ProviderAddedAfterBootstrapError} from '../errors';
import {Injector} from '../injector';
import {Provider} from '../models';

export type DIModuleConfig = {
    imports?: DIModule[];
    providers?: Provider[];
};

export class DIModule {
    private _injector: Injector = new Injector();
    private _bootstrapped = false;
    private readonly _moduleConfig: Required<DIModuleConfig>;

    constructor(moduleConfig: DIModuleConfig) {
        this._moduleConfig = {
            imports: moduleConfig.imports || [],
            providers: moduleConfig.providers || [],
        };
    }

    get injector(): Injector {
        return this._injector;
    }

    set injector(injector: Injector) {
        this._injector = injector;
    }

    get providers(): Provider[] {
        return this._moduleConfig.providers;
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

        const globalProviders = this._getModuleProviders();

        this.injector = new Injector();
        this._registerProviders(globalProviders, this.injector);
        this._bootstrap(globalProviders, this.injector);

        return this;
    }

    private _getModuleProviders(): Provider[] {
        const importedProviders: Provider[] = this._moduleConfig.providers;

        this._moduleConfig.imports.forEach(importedModule => {
            importedProviders.push(...importedModule._getModuleProviders());
        });

        return importedProviders;
    }

    private _bootstrap(providers: Provider[], rootInjector: Injector): void {
        if (this._bootstrapped) {
            return;
        }

        this._moduleConfig.imports.forEach(importedModule => {
            if (importedModule._bootstrapped) {
                return;
            }

            importedModule.injector = new Injector(rootInjector);
            importedModule._registerProviders(providers, rootInjector);
            importedModule._bootstrap(providers, rootInjector);
        });

        this._bootstrapped = true;
    }

    private _registerProviders(providers: Provider[], injector: Injector): void {
        providers.map(provider => this.addProvider(provider, injector));
    }
}

export const bootstrapTestingModule = (config: DIModuleConfig) => {
    return new DIModule(config).bootstrap();
};
