import {DIModule} from '../di-module/di-module';
import {DI_MODULE_METADATA_KEY, DIModuleMetadata} from '../di-module/di-module.decorator';
import {Injector} from '../injector';
import {Class} from '../types';

export class DIApplication {
    private _modules = new Map<Class, DIModule>();

    constructor(private readonly RootModuleClass: Class) {
        this._createModule(RootModuleClass);
        this._modules.get(RootModuleClass)!.bootstrap();
    }

    get rootInjector(): Injector {
        return this._modules.get(this.RootModuleClass)!.injector;
    }

    private _createModule(moduleClass: Class): void {
        const moduleConfig = Reflect.getMetadata(DI_MODULE_METADATA_KEY, moduleClass) as DIModuleMetadata;

        moduleConfig.imports?.forEach(importedModuleClass => this._createModule(importedModuleClass));

        const importedModules =
            moduleConfig.imports?.map(importedModuleClass => this._modules.get(importedModuleClass)!) ?? [];

        const module = new DIModule({
            imports: importedModules,
            providers: [...(moduleConfig.providers ?? [])],
        });

        this._modules.set(moduleClass, module);
    }
}
