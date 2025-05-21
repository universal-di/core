import { Global } from "../decorators/global/global.decorator";
import { Inject } from "../decorators/inject.decorator";
import { Injectable } from "../decorators/injectable";
import { Module } from "../decorators/module/module.decorator";
import { DIContainer } from "../di-container/di-container";
import { InjectableModule } from "../di-module/injectable-module";
import { InjectionToken } from "../models/injection-token.model";
import { DIApplication } from "./di-application";
import { describe, expect, it } from "vitest";

describe("DIApplication", () => {
    let Application: DIApplication;

    it("creates application with a root module", () => {
        @Module({})
        class RootModule {}

        Application = new DIApplication(RootModule);

        expect(Application.rootInjector).toEqual(expect.any(DIContainer));
    });

    it("creates application with modules tree", () => {
        @Injectable()
        class ChildProvider {}

        @Module({
            providers: [ChildProvider],
            exports: [ChildProvider],
        })
        class ChildModule {}

        @Module({
            imports: [ChildModule],
        })
        class RootModule {}

        Application = new DIApplication(RootModule);

        expect(() => Application.rootInjector.get(ChildProvider)).not.toThrow();
    });

    it("instantiates new modules for each app", () => {
        @Injectable()
        class ChildProvider {}

        @Module({
            providers: [ChildProvider],
        })
        class ChildModule {}

        @Module({
            imports: [ChildModule],
        })
        class RootModule {}

        const ApplicationA = new DIApplication(RootModule);
        const ApplicationB = new DIApplication(RootModule);

        [RootModule, ChildModule].forEach((module) =>
            expect(ApplicationA["_modules"].get(module)).not.toBe(
                ApplicationB["_modules"].get(module)
            )
        );
    });

    it("creates application with global modules", () => {
        const token = new InjectionToken("token");

        @Injectable()
        class ChildProvider {}

        @Module({
            providers: [ChildProvider],
            exports: [
                ChildProvider,
                {
                    provide: token,
                    useValue: "token_value",
                },
            ],
        })
        class ChildGlobalModule {}

        @Injectable()
        class GlobalProvider {
            constructor(
                @Inject(token) private readonly _token: string,
                private readonly childProvider: ChildProvider
            ) {}
        }

        @Global()
        @Module({
            imports: [ChildGlobalModule],
            providers: [GlobalProvider],
            exports: [GlobalProvider],
        })
        class GlobalModule {}

        @Module({
            imports: [],
        })
        class ChildModule {}

        @Module({
            imports: [ChildModule, GlobalModule],
        })
        class RootModule {}

        Application = new DIApplication(RootModule);
        const childInjector =
            Application["_modules"].get(ChildModule)!.injector;

        expect(childInjector.get(GlobalProvider)).not.toBeNull();
        expect(Application.rootInjector.get(GlobalProvider)).not.toBeNull();
    });

    it("creates application with nested global modules", () => {
        const token = new InjectionToken("token");

        @Injectable()
        class ChildProvider {}

        @Injectable()
        class NotExportedProvider {}

        @Global()
        @Module({
            providers: [ChildProvider, NotExportedProvider],
            exports: [ChildProvider],
        })
        class NestedChildGlobalModule {}

        @Global()
        @Module({
            imports: [NestedChildGlobalModule],
            providers: [],
            exports: [
                {
                    provide: token,
                    useValue: "token_value",
                },
            ],
        })
        class ChildGlobalModule {}

        @Injectable()
        class GlobalProvider {
            constructor(
                @Inject(token) private readonly _token: string,
                private readonly childProvider: ChildProvider
            ) {}
        }

        @Global()
        @Module({
            imports: [ChildGlobalModule],
            providers: [GlobalProvider],
            exports: [GlobalProvider],
        })
        class GlobalModule {}

        @Module({
            imports: [],
        })
        class ChildModule {}

        @Module({
            imports: [ChildModule, GlobalModule],
        })
        class RootModule {}

        Application = new DIApplication(RootModule);
        const childInjector =
            Application["_modules"].get(ChildModule)!.injector;

        expect(childInjector.get(token)).not.toBeNull();
        expect(childInjector.get(ChildProvider)).not.toBeNull();
        expect(Application.rootInjector.get(token)).not.toBeNull();
        expect(Application.rootInjector.get(ChildProvider)).not.toBeNull();
        expect(() => Application.rootInjector.get(NotExportedProvider)).toThrow(
            "No provider for NotExportedProvider"
        );
    });

    it("encapsulates exported providers", () => {
        const token = new InjectionToken("token");

        @Injectable()
        class StubProvider {
            constructor(@Inject(token) private readonly _token: string) {}
        }

        @Module({
            imports: [],
            providers: [StubProvider],
            exports: [StubProvider],
        })
        class StubModule {}

        @Module({
            imports: [StubModule],
            providers: [
                {
                    provide: token,
                    useValue: "value",
                },
            ],
        })
        class RootModule {}

        Application = new DIApplication(RootModule);
        const childInjector = Application["_modules"].get(StubModule)!.injector;
        expect(() => childInjector.get(StubProvider)).toThrow(
            "No provider for token found in StubProvider"
        );
    });

    it("encapsulates exports from global modules", () => {
        const TOKEN_STUB_A = new InjectionToken("TOKEN_STUB_A");
        const TOKEN_STUB_B = new InjectionToken("TOKEN_STUB_B");

        const exportedChildProviders = [
            {
                provide: TOKEN_STUB_A,
                useValue: "TOKEN_STUB_A",
            },
        ];

        const exportedGlobalProviders = [
            {
                provide: TOKEN_STUB_B,
                useValue: "TOKEN_STUB_B",
            },
        ];

        @Module({
            providers: exportedChildProviders,
            exports: exportedChildProviders,
        })
        class GlobalModuleChild {}

        @Global()
        @Module({
            imports: [GlobalModuleChild],
            providers: exportedGlobalProviders,
            exports: exportedGlobalProviders,
        })
        class GlobalModule {}

        @Module({
            imports: [GlobalModule],
        })
        class RootModule {}

        const app = new DIApplication(RootModule);

        expect(app.rootInjector.get(TOKEN_STUB_B)).toBeTruthy();
        expect(() => app.rootInjector.get(TOKEN_STUB_A)).toThrow();
    });

    it("exports multi providers", () => {
        const TOKEN_STUB_A = new InjectionToken("TOKEN_STUB_A");
        const TOKEN_STUB_B = new InjectionToken("TOKEN_STUB_B");
        const MULTI_TOKEN = new InjectionToken("MULTI_TOKEN");

        @Injectable()
        class StubProviderA {
            constructor(@Inject(TOKEN_STUB_A) private readonly token: string) {}
        }

        @Injectable()
        class StubProviderB {
            constructor(@Inject(TOKEN_STUB_B) private readonly token: string) {}
        }

        const exportedModuleAProviders = [
            {
                provide: MULTI_TOKEN,
                useClass: StubProviderA,
                multi: true,
            },
            {
                provide: TOKEN_STUB_A,
                useValue: "TOKEN_STUB_A",
            },
        ];

        const exportedModuleBProviders = [
            {
                provide: MULTI_TOKEN,
                useClass: StubProviderB,
                multi: true,
            },
            {
                provide: TOKEN_STUB_B,
                useValue: "TOKEN_STUB_B",
            },
        ];

        @Module({
            providers: exportedModuleAProviders,
            exports: exportedModuleAProviders,
        })
        class ChildModuleA {}

        @Module({
            providers: exportedModuleBProviders,
            exports: exportedModuleBProviders,
        })
        class ChildModuleB {}

        @Module({
            imports: [ChildModuleA, ChildModuleB],
        })
        class RootModule {}

        const app = new DIApplication(RootModule);

        expect(app.rootInjector.get(MULTI_TOKEN)).toHaveLength(2);
    });

    it("replaces moduleClass's injector with the real one", () => {
        const TOKEN_STUB = new InjectionToken("TOKEN_STUB");
        const CHILD_TOKEN_STUB = new InjectionToken("CHILD_TOKEN_STUB");
        const tokenValueStub = "abc";
        const childTokenValueStub = "cba";

        @Module({
            providers: [
                {
                    provide: CHILD_TOKEN_STUB,
                    useValue: childTokenValueStub,
                },
            ],
        })
        class ChildModule extends InjectableModule {}

        @Module({
            imports: [ChildModule],
            providers: [
                {
                    provide: TOKEN_STUB,
                    useValue: tokenValueStub,
                },
            ],
        })
        class RootModule extends InjectableModule {}

        expect(() => RootModule.injector.get(TOKEN_STUB)).toThrow();
        expect(() => ChildModule.injector.get(CHILD_TOKEN_STUB)).toThrow();

        new DIApplication(RootModule);

        expect(RootModule.injector.get(TOKEN_STUB)).toEqual(tokenValueStub);
        expect(ChildModule.injector.get(CHILD_TOKEN_STUB)).toEqual(
            childTokenValueStub
        );
    });
});
