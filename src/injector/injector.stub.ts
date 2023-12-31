import {Injector} from './injector';
import {Class} from "../types";

class TestInjector implements Partial<Injector> {
    constructor(private readonly value: any) {}

    get() {
        return this.value;
    }
}

export const InjectorStub = TestInjector as unknown as Class<Injector>;
