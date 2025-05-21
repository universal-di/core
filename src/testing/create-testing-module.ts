import 'reflect-metadata';
import { DIModuleMetadata, Module } from '../decorators/module/module.decorator';
import { DIApplication } from '../di-application';
import { DIContainer } from '../di-container/di-container';

export const createTestingModule = (moduleConfig: DIModuleMetadata): DIContainer => {
    @Module(moduleConfig)
    class TestingModule {}

    const application = new DIApplication(TestingModule);

    return application.rootInjector;
};
