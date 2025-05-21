/* eslint-disable-next-line max-classes-per-file */
import { DIContainer } from "../di-container/di-container";
import { InjectionToken, Token } from "../models";

class NotReadyInjector extends DIContainer {
    override get<T>(token: Token<T> | InjectionToken<T>): T {
        console.error(`Tried to get ${token}, but injector isn't ready yet`);
        return super.get(token);
    }
}

export abstract class InjectableModule {
    // gets replaced with the actual @Module injector during DIApplication bootstrap
    static injector: DIContainer = new NotReadyInjector();
}
