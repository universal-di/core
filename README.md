# Universal Dependency Injection
[![MIT License][license-image]][license] [![Build Status][github-action-image]][github-action-url] [![NPM version][npm-version-image]][npm-url] [![Coverage Status][test-coverage-image]][test-coverage-url] [![PRs welcome][contributing-image]][contributing-url]


## Contents

+ [Providing dependencies](#providing-dependencies)
+ [Injecting dependencies](#injecting-a-dependency)
+ [Advanced usage](#advanced-usage)

## Providing Dependencies

Imagine there is a class called ProductService that needs to act as a dependency in a state.

The first step is to add the @Injectable decorator to show that the class can be injected.

```typescript
@Injectable()
class ProductState {
}

@Injectable()
class ProductService {
}
```

Second step is to make it part of your module

```typescript
@Module({
    providers: [
        ProductState,
        ProductService
    ],
})
class ProductModule {
}
```

The last third step is to bootstrap a `DIApplication` with your module

```typescript
const app = new DIApplication(ProductModule);
```

Once you register a provider, you will get singleton instance of this service every time you'd try to inject it.

## Injecting a Dependency

Registered provider can be injected into a class from the same `@Module`

```typescript
@Injectable()
class ProductState {
    constructor(private productService: ProductService) {
    }
}
```

or directly from the bootstrapped module

```tsx
const productState = app.rootInjector.get(ProductState);
```

Besides being a singleton, class is instantiated only when injected, not before.

## Ports

In order to make working with universal-di easier (e.g. injecting dependencies), you can take advantage of ports for particular libraries:
- React [@universal-di/react](https://npmjs.org/package/@universal-di/react)

## Advanced usage

Imagine you are tracking events differently depending on environment

```typescript
interface AnalyticsService {
    track(event: string): void;
}

const ANALYTICS_SERVICE = new InjectionToken<AnalyticsService>('ANALYTICS_SERVICE')
```

After defining the abstraction, next step will be to define implementations

```typescript
@Injectable()
class RealAnalyticsService implements AnalyticsService {
    constructor(
        @Inject(TRACKING_API_URL) private readonly _trackingApiUrl: string,
        private readonly _httpClient: HttpClient,
    ) {
    }

    track(event: string): void {
        this._httpClient.post<void>(this._trackingApiUrl);
    }
}

@Injectable()
class ConsoleAnalyticsService implements AnalyticsService {
    track(event: string): void {
        console.log('[tracking]', event);
    }
}
```

Put together in a `@Module`

```typescript
const TRACKING_API_URL = new InjectionToken<string>('TRACKING_API_URL');

@Module({
    providers: [
        {
            provide: ANALYTICS_SERVICE,
            useClass: isDev() ? ConsoleAnalyticsService : RealAnalyticsService,
        },
        {
            provide: TRACKING_API_URL,
            useValue: '/api/track',
        }
    ],
})
class AnalyticsModule {
}

@Module({
    imports: [
        AnalyticsModule,
    ],
    providers: [
        HttpClient,
    ]
})
class AppModule {
}
```

And use

```tsx
const application = new DIApplication(AppModule);

const analyticsService = application.rootInjector.get(ANALYTICS_SERVICE); // AnalyticsService type is inferred here

analyticsService.track('application-started');
```

### Authors
[![szymeo](https://avatars.githubusercontent.com/u/11583029?v=4&s=40)](https://github.com/szymeo)
[![bartoszswitalski](https://avatars.githubusercontent.com/u/45360754?v=4&s=40)](https://github.com/b-sw)

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: LICENSE.md

[github-action-image]: https://github.com/szymeo/universal-di.core/actions/workflows/build-and-publish.yml/badge.svg
[github-action-url]: https://github.com/szymeo/universal-di.core/actions/workflows/build-and-publish.yml

[npm-url]: https://npmjs.org/package/@universal-di/core
[npm-version-image]: https://badge.fury.io/js/@universal-di/core.svg

[test-coverage-url]: https://codecov.io/gh/szymeo/universal-di.core
[test-coverage-image]: https://codecov.io/gh/szymeo/universal-di.core/branch/master/graph/badge.svg

[contributing-url]: https://github.com/szymeo/universal-di.core/blob/master/CONTRIBUTING.md
[contributing-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
