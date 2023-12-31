import {Inject, Injectable} from '../decorators';
import {DIModule} from './di-module';
import {InjectionToken} from '../models';
import {describe, expect, it, vi} from 'vitest';

describe('DIModule', () => {
    const MY_TOKEN = new InjectionToken('MY_TOKEN');
    const MY_MULTI_TOKEN = new InjectionToken('MY_MULTI_TOKEN');
    const MY_CLASS_MULTI_TOKEN = new InjectionToken('MY_CLASS_MULTI_TOKEN');

    it('creates a module', () => {
        const Module = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(Module).toBeTruthy();
    });

    it('does not bootstrap module twice', () => {
        const Module = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(() => Module.bootstrap()).toThrow('Module already bootstrapped');
    });

    it('injects providers', () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class MultiStubProvider {
        }

        @Injectable()
        class NestedStubProvider {
            constructor(
                @Inject(MY_TOKEN) readonly myToken: string,
                @Inject(MY_MULTI_TOKEN) readonly myMultiToken: string[],
                @Inject(MY_CLASS_MULTI_TOKEN) readonly myClassMultiToken: MultiStubProvider[],
            ) {
            }

            handle(): void {
                nestedStubProviderHandleSpy(this.myToken, this.myMultiToken, this.myClassMultiToken);
            }
        }

        @Injectable()
        class StubProvider {
            constructor(readonly _nestedStubProvider: NestedStubProvider) {
            }

            handle(): void {
                this._nestedStubProvider.handle();
            }
        }

        const Module = new DIModule({
            imports: [],
            providers: [
                StubProvider,
                NestedStubProvider,
                {
                    provide: MY_TOKEN,
                    useValue: 'my_token_value',
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: 'my_multi_token_value1',
                    multi: true,
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: 'my_multi_token_value2',
                    multi: true,
                },
                {
                    provide: MY_CLASS_MULTI_TOKEN,
                    useClass: MultiStubProvider,
                    multi: true,
                },
                {
                    provide: MY_CLASS_MULTI_TOKEN,
                    useClass: MultiStubProvider,
                    multi: true,
                },
            ],
        }).bootstrap();

        (Module.injector.get(StubProvider) as StubProvider).handle();

        expect(nestedStubProviderHandleSpy).toHaveBeenCalledWith(
            'my_token_value',
            ['my_multi_token_value1', 'my_multi_token_value2'],
            [expect.any(MultiStubProvider), expect.any(MultiStubProvider)],
        );
    });

    it('creates tree from imported modules', () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
            constructor(
                @Inject(MY_TOKEN) readonly myToken: string,
                @Inject(MY_MULTI_TOKEN) readonly myMultiToken: string[],
            ) {
            }

            handle(): void {
                nestedStubProviderHandleSpy(this.myToken, this.myMultiToken);
            }
        }

        const ChildModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        const MainModule = new DIModule({
            imports: [ChildModule],
            providers: [
                {
                    provide: MY_TOKEN,
                    useValue: 'my_token_value',
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: 'my_multi_token_value1',
                    multi: true,
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: 'my_multi_token_value2',
                    multi: true,
                },
            ],
        }).bootstrap();

        (ChildModule.injector.get(StubProvider) as StubProvider).handle();

        expect(() => MainModule.injector.get(StubProvider)).not.toThrowError('No provider for StubProvider');
        expect(nestedStubProviderHandleSpy).toHaveBeenCalledWith('my_token_value', [
            'my_multi_token_value1',
            'my_multi_token_value2',
        ]);
    });

    it('provider from imported module is global', () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
            handle(): void {
                nestedStubProviderHandleSpy();
            }
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        const ChildModule = new DIModule({
            imports: [],
            providers: [],
        });

        const RootModule = new DIModule({
            imports: [SharedModule, ChildModule],
            providers: [],
        }).bootstrap();

        (RootModule.injector.get(StubProvider) as StubProvider).handle();

        expect(nestedStubProviderHandleSpy).toHaveBeenCalled();
        expect(() => ChildModule.injector.get(StubProvider)).not.toThrowError('No provider for StubProvider');
    });

    it('should throw specific error messages', () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
            constructor(@Inject(MY_TOKEN) readonly myToken: string) {
            }

            handle(): void {
                nestedStubProviderHandleSpy();
            }
        }

        const ChildModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        new DIModule({
            imports: [ChildModule],
            providers: [],
        }).bootstrap();

        expect(() => ChildModule.injector.get(StubProvider)).toThrowError(
            'No provider for MY_TOKEN found in StubProvider',
        );
    });

    it('should not allow to register provider after bootstrapping', () => {
        const RootModule = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(() =>
            RootModule.addProvider({
                provide: MY_TOKEN,
                useValue: 'foo',
            }),
        ).toThrowError('Cannot add providers after module has been bootstrapped');
    });

    it('allows for a shared module in root imports', () => {
        @Injectable()
        class StubProvider {
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        const ChildModule = new DIModule({
            imports: [SharedModule],
            providers: [],
        });

        const ChildModule2 = new DIModule({
            imports: [SharedModule],
            providers: [],
        });

        const RootModule = new DIModule({
            imports: [ChildModule, ChildModule2],
            providers: [],
        });

        const bootstrap = () => RootModule.bootstrap();

        expect(bootstrap).not.toThrow();
    });

    it('allows root child to import another root child', () => {
        @Injectable()
        class StubProvider {
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        const ChildModule = new DIModule({
            imports: [SharedModule],
            providers: [],
        });

        const RootModule = new DIModule({
            imports: [ChildModule, SharedModule],
            providers: [],
        });

        const bootstrap = () => RootModule.bootstrap();

        expect(bootstrap).not.toThrow();
    });

    it('allows child provider to use another child export', () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
        }

        @Injectable()
        class StubProvider2 {
            constructor(readonly stubProvider: StubProvider) {
            }

            handle(): void {
                nestedStubProviderHandleSpy(this.stubProvider);
            }
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });

        const ChildModule = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider2],
        });

        const RootModule = new DIModule({
            imports: [SharedModule, ChildModule],
            providers: [],
        });

        RootModule.bootstrap();

        const handle = () => (ChildModule.injector.get(StubProvider2) as StubProvider2).handle();
        expect(handle).not.toThrow();
        expect(ChildModule.injector.get(StubProvider)).toEqual(expect.any(StubProvider));
    });

    it('uses singleton scope', () => {
        const constructorSpy = vi.fn();

        @Injectable()
        class StubProvider {
            constructor() {
                constructorSpy();
            }
        }

        @Injectable()
        class StubProvider2 {
            constructor(readonly stubProvider: StubProvider) {
            }

            method(): void {
            }
        }

        @Injectable()
        class StubProvider3 {
            constructor(readonly stubProvider: StubProvider) {
            }

            method(): void {
            }
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [StubProvider],
        });
        const ChildModuleA = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider2],
        });
        const ChildModuleB = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider3],
        });
        const RootModule = new DIModule({
            imports: [ChildModuleA, ChildModuleB],
            providers: [],
        });

        RootModule.bootstrap();
        (ChildModuleA.injector.get(StubProvider2) as StubProvider2).method();
        (ChildModuleB.injector.get(StubProvider3) as StubProvider3).method();

        expect(constructorSpy).toHaveBeenCalledTimes(1);
    });

    it('provides from root to leaf nodes', () => {
        @Injectable()
        class StubProvider {
        }

        @Injectable()
        class StubProvider2 {
        }

        @Injectable()
        class StubProviderFromChild {
            constructor(readonly stubProvider: StubProvider, readonly stubProvider2: StubProvider2) {
            }

            method(): void {
            }
        }

        const ChildModule = new DIModule({
            imports: [],
            providers: [StubProviderFromChild],
        });

        const ParentModule = new DIModule({
            imports: [ChildModule],
            providers: [StubProvider2],
        });

        const RootModule = new DIModule({
            imports: [ParentModule],
            providers: [StubProvider],
        });

        RootModule.bootstrap();

        expect(ChildModule.injector.get(StubProviderFromChild)).toEqual(expect.any(StubProviderFromChild));
    });

    it('provides from multiple modules', () => {
        @Injectable()
        class StubProviderFromParentA {
        }

        @Injectable()
        class StubProviderFromParentB {
        }

        @Injectable()
        class StubProviderFromChild {
            constructor(
                readonly stubProvider: StubProviderFromParentA,
                readonly stubProvider2: StubProviderFromParentB,
            ) {
            }

            method(): void {
            }
        }

        const ChildModule = new DIModule({
            imports: [],
            providers: [StubProviderFromChild],
        });

        const ParentModuleA = new DIModule({
            providers: [StubProviderFromParentA],
        });

        const ParentModuleB = new DIModule({
            providers: [StubProviderFromParentB],
        });

        const RootModule = new DIModule({
            imports: [ChildModule, ParentModuleA, ParentModuleB],
            providers: [],
        });

        RootModule.bootstrap();

        expect(ChildModule.injector.get(StubProviderFromChild)).toEqual(expect.any(StubProviderFromChild));
    });

    it('stacks multi from different modules', () => {
        @Injectable()
        class StubProviderFromChildA {
        }

        @Injectable()
        class StubProviderFromChildB {
        }

        const TOKEN = new InjectionToken('TOKEN');

        const ChildModuleA = new DIModule({
            imports: [],
            providers: [
                {
                    provide: TOKEN,
                    useClass: StubProviderFromChildA,
                    multi: true,
                },
            ],
        });

        const ChildModuleB = new DIModule({
            imports: [],
            providers: [
                {
                    provide: TOKEN,
                    useClass: StubProviderFromChildB,
                    multi: true,
                },
            ],
        });

        const RootModule = new DIModule({
            imports: [ChildModuleA, ChildModuleB],
            providers: [],
        });

        RootModule.bootstrap();

        expect(RootModule.injector.get(TOKEN)).toEqual(
            expect.arrayContaining([expect.any(StubProviderFromChildA), expect.any(StubProviderFromChildB)]),
        );
    });
});
