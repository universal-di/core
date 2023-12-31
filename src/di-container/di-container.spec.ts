import {Inject, Injectable} from '../decorators';
import {DIContainer} from './di-container';
import {InjectionToken} from '../models';
import {beforeEach, describe, expect, it, vi} from 'vitest';

describe('DIContainer', () => {
    let diContainer: DIContainer;

    const providedValueStub = 'stub-value';
    const MY_CLASS_TOKEN = new InjectionToken('MY_CLASS_TOKEN');
    const MY_VALUE_TOKEN = new InjectionToken('MY_VALUE_TOKEN');
    const MY_MULTI_CLASS_TOKEN = new InjectionToken('MY_MULTI_CLASS_TOKEN');
    const MY_MULTI_VALUE_TOKEN = new InjectionToken('MY_MULTI_VALUE_TOKEN');

    beforeEach(() => {
        diContainer = new DIContainer();
    });

    it('should create', () => {
        expect(diContainer).toBeTruthy();
    });

    describe('registering providers', () => {
        @Injectable()
        class StubProvider {}

        it('registers class token provider', () => {
            diContainer.addProvider(StubProvider);

            expect(diContainer['inject'](StubProvider)).toEqual(expect.any(StubProvider));
        });

        it('registers class provider', () => {
            diContainer.addProvider({
                provide: MY_CLASS_TOKEN,
                useClass: StubProvider,
            });

            expect(diContainer['inject'](MY_CLASS_TOKEN)).toEqual(expect.any(StubProvider));
        });

        it('registers value token provider', () => {
            diContainer.addProvider({
                provide: MY_VALUE_TOKEN,
                useValue: providedValueStub,
            });

            expect(diContainer['inject'](MY_VALUE_TOKEN)).toEqual(providedValueStub);
        });

        it('registers multi class provider', () => {
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

            expect(diContainer['inject'](MY_MULTI_CLASS_TOKEN)).toEqual([
                expect.any(StubProvider),
                expect.any(StubProvider),
            ]);
        });

        it('registers multi value token provider', () => {
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

            expect(diContainer['inject'](MY_MULTI_VALUE_TOKEN)).toEqual([providedValueStub, providedValueStub]);
        });
    });

    describe('caching providers', () => {
        it('caches class token provider', () => {
            const stubProviderConstructedSpy = vi.fn();

            @Injectable()
            class StubProvider {
                constructor() {
                    stubProviderConstructedSpy();
                }
            }

            diContainer.addProvider(StubProvider);
            diContainer.addProvider(StubProvider);
            diContainer['inject'](StubProvider);
            diContainer['inject'](StubProvider);

            expect(stubProviderConstructedSpy).toHaveBeenCalledTimes(1);
        });

        it('caches class provider', () => {
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
            diContainer['inject'](MY_CLASS_TOKEN);
            diContainer['inject'](MY_CLASS_TOKEN);

            expect(stubProviderConstructedSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('resolving injected params values', () => {
        const nestedStubProviderFieldValue = 'foo';

        @Injectable()
        class NestedStubProvider {
            readonly field = nestedStubProviderFieldValue;
        }

        it('resolves injected params values', () => {
            const stubProviderCallbackSpy = vi.fn();
            const myValueTokenStub = 'abc123';

            @Injectable()
            class StubProvider {
                constructor(
                    @Inject(MY_VALUE_TOKEN) private readonly myValueToken: string,
                    private readonly _nestedStubProvider: NestedStubProvider,
                ) {
                    stubProviderCallbackSpy(myValueToken, _nestedStubProvider.field);
                }
            }

            diContainer.addProvider(StubProvider);
            diContainer.addProvider({
                provide: MY_VALUE_TOKEN,
                useValue: myValueTokenStub,
            });
            diContainer.addProvider(NestedStubProvider);
            diContainer['inject'](StubProvider);

            expect(stubProviderCallbackSpy).toHaveBeenCalledWith(myValueTokenStub, nestedStubProviderFieldValue);
        });

        it('throws error when injected param (value token) value was not found', () => {
            @Injectable()
            class StubProvider {
                constructor(@Inject(MY_VALUE_TOKEN) private readonly myValueToken: string) {}
            }

            diContainer.addProvider(StubProvider);

            expect(() => diContainer['inject'](StubProvider)).toThrowError(
                'No provider for MY_VALUE_TOKEN found in StubProvider',
            );
        });

        it('throws error when injected param (class token) value was not found', () => {
            @Injectable()
            class StubProvider {
                constructor(private readonly _nestedStubProvider: NestedStubProvider) {}
            }

            diContainer.addProvider(StubProvider);

            expect(() => diContainer['inject'](StubProvider)).toThrowError(
                'No provider for NestedStubProvider found in StubProvider',
            );
        });
    });
});
