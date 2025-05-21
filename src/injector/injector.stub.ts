import { DIContainer } from "../di-container/di-container";
import { Class } from "../types.js";

class TestInjector implements Partial<DIContainer> {
    constructor(private readonly value: any) {}

    get() {
        return this.value;
    }
}

export const InjectorStub = TestInjector as unknown as Class<DIContainer>;
