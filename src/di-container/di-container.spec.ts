/* eslint-disable max-classes-per-file */
import { Inject, Injectable } from "../decorators";
import { InjectionToken } from "../models";
import { DIContainer } from "./di-container";
import { describe, expect, it, beforeEach, vi } from "vitest";

describe("DIContainer", () => {
    let diContainer: DIContainer;

    const providedValueStub = "stub-value";
    const MY_CLASS_TOKEN = new InjectionToken("MY_CLASS_TOKEN");
    const MY_VALUE_TOKEN = new InjectionToken("MY_VALUE_TOKEN");
    const MY_MULTI_CLASS_TOKEN = new InjectionToken("MY_MULTI_CLASS_TOKEN");
    const MY_MULTI_VALUE_TOKEN = new InjectionToken("MY_MULTI_VALUE_TOKEN");

    beforeEach(() => {
        diContainer = new DIContainer();
    });

    it("should create", () => {
        expect(diContainer).toBeTruthy();
    });

    describe("registering providers", () => {
        @Injectable()
        class StubProvider {}

        it("should register class token provider", () => {
            diContainer.addProvider(StubProvider);

            expect(diContainer["get"](StubProvider)).toEqual(
                expect.any(StubProvider)
            );
        });

        it("should register class provider", () => {
            diContainer.addProvider({
                provide: MY_CLASS_TOKEN,
                useClass: StubProvider,
            });

            expect(diContainer["get"](MY_CLASS_TOKEN)).toEqual(
                expect.any(StubProvider)
            );
        });

        it("should register value token provider", () => {
            diContainer.addProvider({
                provide: MY_VALUE_TOKEN,
                useValue: providedValueStub,
            });

            expect(diContainer["get"](MY_VALUE_TOKEN)).toEqual(
                providedValueStub
            );
        });

        it("should register multi class provider", () => {
            diContainer.addProvider({
                provide: MY_MULTI_CLASS_TOKEN,
                useClass: StubProvider,
                multi: true,
            });
            diContainer.addProvider({
                provide: MY_MULTI_CLASS_TOKEN,
                useClass: StubProvider,
                multi: true,
            });

            expect(diContainer["get"](MY_MULTI_CLASS_TOKEN)).toEqual([
                expect.any(StubProvider),
                expect.any(StubProvider),
            ]);
        });

        it("should register multi value token provider", () => {
            diContainer.addProvider({
                provide: MY_MULTI_VALUE_TOKEN,
                useValue: providedValueStub,
                multi: true,
            });
            diContainer.addProvider({
                provide: MY_MULTI_VALUE_TOKEN,
                useValue: providedValueStub,
                multi: true,
            });

            expect(diContainer["get"](MY_MULTI_VALUE_TOKEN)).toEqual([
                providedValueStub,
                providedValueStub,
            ]);
        });
    });

    describe("caching providers", () => {
        it("should cache class token provider", () => {
            const stubProviderConstructedSpy = vi.fn();

            @Injectable()
            class StubProvider {
                constructor() {
                    stubProviderConstructedSpy();
                }
            }

            diContainer.addProvider(StubProvider);
            diContainer.addProvider(StubProvider);
            diContainer["get"](StubProvider);
            diContainer["get"](StubProvider);

            expect(stubProviderConstructedSpy).toHaveBeenCalledTimes(1);
        });

        it("should cache class provider", () => {
            const stubProviderConstructedSpy = vi.fn();

            @Injectable()
            class StubProvider {
                constructor() {
                    stubProviderConstructedSpy();
                }
            }

            diContainer.addProvider({
                provide: MY_CLASS_TOKEN,
                useClass: StubProvider,
            });
            diContainer.addProvider({
                provide: MY_CLASS_TOKEN,
                useClass: StubProvider,
            });
            diContainer["get"](MY_CLASS_TOKEN);
            diContainer["get"](MY_CLASS_TOKEN);

            expect(stubProviderConstructedSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("resolving injected params values", () => {
        const nestedStubProviderFieldValue = "foo";

        @Injectable()
        class NestedStubProvider {
            readonly field = nestedStubProviderFieldValue;
        }

        it("should resolve injected params values", () => {
            const stubProviderCallbackSpy = vi.fn();
            const myValueTokenStub = "abc123";

            @Injectable()
            class StubProvider {
                constructor(
                    @Inject(MY_VALUE_TOKEN)
                    private readonly myValueToken: string,
                    private readonly _nestedStubProvider: NestedStubProvider
                ) {
                    stubProviderCallbackSpy(
                        myValueToken,
                        _nestedStubProvider.field
                    );
                }
            }

            diContainer.addProvider(StubProvider);
            diContainer.addProvider({
                provide: MY_VALUE_TOKEN,
                useValue: myValueTokenStub,
            });
            diContainer.addProvider(NestedStubProvider);
            diContainer["get"](StubProvider);

            expect(stubProviderCallbackSpy).toHaveBeenCalledWith(
                myValueTokenStub,
                nestedStubProviderFieldValue
            );
        });

        it("should throw error when injected param (value token) value was not found", () => {
            @Injectable()
            class StubProvider {
                constructor(
                    @Inject(MY_VALUE_TOKEN)
                    private readonly myValueToken: string
                ) {}
            }

            diContainer.addProvider(StubProvider);

            expect(() => diContainer["get"](StubProvider)).toThrowError(
                "No provider for MY_VALUE_TOKEN found in StubProvider"
            );
        });

        it("should throw error when injected param (class token) value was not found", () => {
            @Injectable()
            class StubProvider {
                constructor(
                    private readonly _nestedStubProvider: NestedStubProvider
                ) {}
            }

            diContainer.addProvider(StubProvider);

            expect(() => diContainer["get"](StubProvider)).toThrowError(
                "No provider for NestedStubProvider found in StubProvider"
            );
        });
    });
});
