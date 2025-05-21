import { InvalidModuleConfigError } from "../../errors";
import { Provider } from "../../models/provider.model";
import { Class } from "../../types.js";

export const DI_MODULE_METADATA_KEY = Symbol("DI:MODULE_METADATA_KEY");

export type DIModuleMetadata = {
    imports?: Class<any>[];
    providers?: Provider[];
    exports?: Provider[];
};

const DIModuleMetadataKeys = {
    IMPORTS: "imports",
    PROVIDERS: "providers",
    EXPORTS: "exports",
};

const metadataKeys = Object.values(DIModuleMetadataKeys);

function validateModuleKeys(keys: string[]): void {
    keys.forEach((key) => {
        if (!metadataKeys.includes(key)) {
            throw new InvalidModuleConfigError(key);
        }
    });
}

export function Module(metadata: DIModuleMetadata): ClassDecorator {
    const propsKeys = Object.keys(metadata);
    validateModuleKeys(propsKeys);

    return (target: Function) => {
        Reflect.defineMetadata(DI_MODULE_METADATA_KEY, metadata, target);
    };
}

export function getModuleConfig<T>(target: Class<T>): DIModuleMetadata {
    return Reflect.getMetadata(DI_MODULE_METADATA_KEY, target);
}
