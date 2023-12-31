import {Injectable} from '../decorators/injectable';
import {Module} from '../di-module/di-module.decorator';
import {Injector} from '../injector';
import {DIApplication} from './di-application';
import {describe, expect, it} from 'vitest';

describe.skip('DIApplication', () => {
    let Application: DIApplication;

    it('creates application with a root module', () => {
        @Module({})
        class RootModule {
        }

        Application = new DIApplication(RootModule);

        expect(Application.rootInjector).toEqual(expect.any(Injector));
    });

    it('creates application with modules tree', () => {
        @Injectable()
        class ChildProvider {
        }

        @Module({
            providers: [ChildProvider],
        })
        class ChildModule {
        }

        @Module({
            imports: [ChildModule],
        })
        class RootModule {
        }

        Application = new DIApplication(RootModule);

        expect(() => Application.rootInjector.get(ChildProvider)).not.toThrow();
    });

    it('instantiates new modules for each app', () => {
        @Injectable()
        class ChildProvider {
        }

        @Module({
            providers: [ChildProvider],
        })
        class ChildModule {
        }

        @Module({
            imports: [ChildModule],
        })
        class RootModule {
        }

        const ApplicationA = new DIApplication(RootModule);
        const ApplicationB = new DIApplication(RootModule);

        [RootModule, ChildModule].forEach(module =>
            expect(ApplicationA['_modules'].get(module)).not.toBe(ApplicationB['_modules'].get(module)),
        );
    });
});
