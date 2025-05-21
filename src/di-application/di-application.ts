import { isGlobalModule } from "../decorators/global/global.decorator";
import { getModuleConfig } from "../decorators/module/module.decorator";
import { DIContainer } from "../di-container/di-container";
import { DIModule } from "../di-module/di-module";
import { Class } from "../types.js";

export class DIApplication {
    private _modules = new Map<Class<any>, DIModule>();
    private _globalModules = new Map<Class<any>, DIModule>();

    constructor(private readonly RootModuleClass: Class<any>) {
        this._createGlobalModules();
        this._createModule(RootModuleClass);
        this._modules.get(RootModuleClass)?.bootstrap();
        this._overrideInjectors();
    }

    get rootInjector(): DIContainer {
        return this._getModule(this.RootModuleClass)!.injector;
    }

    private _createGlobalModules(): void {
        this._traverse((moduleClass: Class<any>) => {
            if (!isGlobalModule(moduleClass)) {
                return;
            }

            this._globalModules.set(
                moduleClass,
                this._moduleFactory(moduleClass, false)
            );
        });
    }

    private _overrideInjectors(): void {
        this._traverse((moduleClass: Class<any>) => {
            moduleClass["injector"] = this._getModule(moduleClass).injector;
        });
    }

    private _traverse(callback: (moduleClass: Class<any>) => void): void {
        const traverse = (moduleClass: Class<any>): void => {
            const moduleConfig = getModuleConfig(moduleClass);
            callback(moduleClass);

            moduleConfig.imports?.forEach((importedModuleClass) => {
                traverse(importedModuleClass);
            });
        };

        traverse(this.RootModuleClass);
    }

    private _createModule(
        moduleClass: Class<any>,
        withGlobalProviders = true
    ): void {
        if (this._hasModule(moduleClass)) {
            return;
        }

        const module = this._moduleFactory(moduleClass, withGlobalProviders);

        this._modules.set(moduleClass, module);
    }

    private _moduleFactory(
        moduleClass: Class<any>,
        withGlobalProviders = true
    ): DIModule {
        const moduleConfig = getModuleConfig(moduleClass);

        moduleConfig.imports?.forEach((importedModuleClass) =>
            this._createModule(importedModuleClass)
        );

        const importedModules =
            moduleConfig.imports?.map(
                (importedModuleClass) => this._getModule(importedModuleClass)!
            ) ?? [];

        return new DIModule({
            imports: [
                ...importedModules,
                ...((withGlobalProviders && this._globalModules.values()) ||
                    []),
            ],
            providers: [...(moduleConfig.providers ?? [])],
            exports: [...(moduleConfig.exports ?? [])],
        });
    }

    private _hasModule(moduleClass: Class<any>): boolean {
        return (this._modules.has(moduleClass) ||
            this._globalModules.has(moduleClass))!;
    }

    private _getModule(moduleClass: Class<any>): DIModule {
        return (this._modules.get(moduleClass) ||
            this._globalModules.get(moduleClass))!;
    }
}
