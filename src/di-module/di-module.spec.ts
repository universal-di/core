/* eslint-disable max-classes-per-file */
import { Inject, Injectable, InjectFactory } from "../decorators";
import { Factory, InjectionToken } from "../models";
import { DIModule } from "./di-module";
import { describe, it, expect, vi } from "vitest";

describe("DIModule", () => {
    const MY_TOKEN = new InjectionToken("MY_TOKEN");
    const MY_MULTI_TOKEN = new InjectionToken("MY_MULTI_TOKEN");
    const MY_CLASS_MULTI_TOKEN = new InjectionToken("MY_CLASS_MULTI_TOKEN");

    it("creates a module", () => {
        const Module = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(Module).toBeTruthy();
    });

    it("does not bootstrap module twice", () => {
        const Module = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(() => Module.bootstrap()).toThrow("Module already bootstrapped");
    });

    it("injects providers", () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class MultiStubProvider {}

        @Injectable()
        class NestedStubProvider {
            constructor(
                @Inject(MY_TOKEN) readonly myToken: string,
                @Inject(MY_MULTI_TOKEN) readonly myMultiToken: string[],
                @Inject(MY_CLASS_MULTI_TOKEN)
                readonly myClassMultiToken: MultiStubProvider[]
            ) {}

            handle(): void {
                nestedStubProviderHandleSpy(
                    this.myToken,
                    this.myMultiToken,
                    this.myClassMultiToken
                );
            }
        }

        @Injectable()
        class StubProvider {
            constructor(readonly _nestedStubProvider: NestedStubProvider) {}

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
                    useValue: "my_token_value",
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: "my_multi_token_value1",
                    multi: true,
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: "my_multi_token_value2",
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

        Module.injector.get(StubProvider).handle();

        expect(nestedStubProviderHandleSpy).toHaveBeenCalledWith(
            "my_token_value",
            ["my_multi_token_value1", "my_multi_token_value2"],
            [expect.any(MultiStubProvider), expect.any(MultiStubProvider)]
        );
    });

    it("creates tree from imported modules", () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
            constructor(
                @Inject(MY_TOKEN) readonly myToken: string,
                @Inject(MY_MULTI_TOKEN) readonly myMultiToken: string[]
            ) {}

            handle(): void {
                nestedStubProviderHandleSpy(this.myToken, this.myMultiToken);
            }
        }

        const ChildModule = new DIModule({
            imports: [],
            providers: [
                StubProvider,
                {
                    provide: MY_TOKEN,
                    useValue: "my_token_value",
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: "my_multi_token_value1",
                    multi: true,
                },
                {
                    provide: MY_MULTI_TOKEN,
                    useValue: "my_multi_token_value2",
                    multi: true,
                },
            ],
            exports: [StubProvider],
        });

        const MainModule = new DIModule({
            imports: [ChildModule],
        }).bootstrap();

        ChildModule.injector.get(StubProvider).handle();

        expect(() => MainModule.injector.get(StubProvider)).not.toThrowError(
            "No provider for StubProvider"
        );
        expect(nestedStubProviderHandleSpy).toHaveBeenCalledWith(
            "my_token_value",
            ["my_multi_token_value1", "my_multi_token_value2"]
        );
    });

    it("provider from imported module is not global", () => {
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

        expect(() => RootModule.injector.get(StubProvider)).toThrowError(
            "No provider for StubProvider"
        );
        expect(() => ChildModule.injector.get(StubProvider)).toThrowError(
            "No provider for StubProvider"
        );
    });

    it("should throw specific error messages", () => {
        const nestedStubProviderHandleSpy = vi.fn();

        @Injectable()
        class StubProvider {
            constructor(@Inject(MY_TOKEN) readonly myToken: string) {}

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
            "No provider for MY_TOKEN found in StubProvider"
        );
    });

    it("should not allow to register provider after bootstrapping", () => {
        const RootModule = new DIModule({
            imports: [],
            providers: [],
        }).bootstrap();

        expect(() =>
            RootModule.addProvider({
                provide: MY_TOKEN,
                useValue: "foo",
            })
        ).toThrowError(
            "Cannot add providers after module has been bootstrapped"
        );
    });

    it("allows for a shared module in root imports", () => {
        @Injectable()
        class StubProvider {}

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

    it("allows root child to import another root child", () => {
        @Injectable()
        class StubProvider {}

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

    it("uses singleton scope", () => {
        const constructorSpy = vi.fn();

        @Injectable()
        class ChildStubProvider {
            constructor() {
                constructorSpy();
            }
        }

        @Injectable()
        class StubProvider1 {
            constructor(readonly stubProvider: ChildStubProvider) {}

            method(): void {}
        }

        @Injectable()
        class StubProvider2 {
            constructor(readonly stubProvider: ChildStubProvider) {}

            method(): void {}
        }

        @Injectable()
        class StubProvider3 {
            constructor(readonly stubProvider: ChildStubProvider) {}

            method(): void {}
        }

        const SharedModule = new DIModule({
            imports: [],
            providers: [ChildStubProvider],
            exports: [ChildStubProvider],
        });
        const ChildModuleA = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider1],
        });
        const ChildModuleB = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider2],
        });
        const ChildModuleC = new DIModule({
            imports: [SharedModule],
            providers: [StubProvider3],
        });
        const RootModule = new DIModule({
            imports: [ChildModuleA, ChildModuleB, ChildModuleC],
            providers: [],
        });

        RootModule.bootstrap();
        ChildModuleA.injector.get(StubProvider1).method();
        ChildModuleB.injector.get(StubProvider2).method();
        ChildModuleC.injector.get(StubProvider3).method();

        expect(constructorSpy).toHaveBeenCalledTimes(1);
    });

    it("provides from multiple modules", () => {
        @Injectable()
        class StubProviderFromParentA {}

        @Injectable()
        class StubProviderFromParentB {}

        @Injectable()
        class StubProviderFromChild {
            constructor(
                readonly stubProvider: StubProviderFromParentA,
                readonly stubProvider2: StubProviderFromParentB
            ) {}

            method(): void {}
        }

        const ParentModuleA = new DIModule({
            providers: [StubProviderFromParentA],
            exports: [StubProviderFromParentA],
        });

        const ParentModuleB = new DIModule({
            providers: [StubProviderFromParentB],
            exports: [StubProviderFromParentB],
        });

        const ChildModule = new DIModule({
            imports: [ParentModuleA, ParentModuleB],
            providers: [StubProviderFromChild],
        });

        const RootModule = new DIModule({
            imports: [ChildModule],
            providers: [],
        });

        RootModule.bootstrap();

        expect(ChildModule.injector.get(StubProviderFromChild)).toEqual(
            expect.any(StubProviderFromChild)
        );
    });

    it("stacks multi from different modules", () => {
        @Injectable()
        class StubProviderFromChildA {}

        @Injectable()
        class StubProviderFromChildB {}

        const TOKEN = new InjectionToken("TOKEN");

        const ChildModuleA = new DIModule({
            imports: [],
            providers: [
                {
                    provide: TOKEN,
                    useClass: StubProviderFromChildA,
                    multi: true,
                },
            ],
            exports: [
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
            exports: [
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
            expect.arrayContaining([
                expect.any(StubProviderFromChildA),
                expect.any(StubProviderFromChildB),
            ])
        );
    });

    it("injects factory", () => {
        let featureId = 1;

        @Injectable()
        class StubFeature {
            id = featureId++;
        }

        @Injectable()
        class StubFeatureConsumer {
            private _features: StubFeature[];

            constructor(
                @InjectFactory(StubFeature)
                private readonly _featureFactory: Factory<StubFeature>
            ) {
                this._features = [
                    this._featureFactory(),
                    this._featureFactory(),
                    this._featureFactory(),
                ];
            }

            get featureIds(): number[] {
                return this._features.map((service) => service.id);
            }
        }

        const RootModule = new DIModule({
            providers: [StubFeature, StubFeatureConsumer],
        }).bootstrap();

        const featureConsumer = RootModule.injector.get(StubFeatureConsumer);

        expect(featureConsumer.featureIds).toEqual([1, 2, 3]);
    });
});
