import 'reflect-metadata';
import {DIApplication} from '../di-application';
import {DIModuleMetadata, Module} from '../di-module/di-module.decorator';
import {Injector} from '../injector';

export const createTestingModule = (moduleConfig: DIModuleMetadata): Injector => {
    @Module(moduleConfig)
    class TestingModule {}

    const application = new DIApplication(TestingModule);

    return application.rootInjector;
};
