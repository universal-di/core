import { Injectable } from "../decorators";
import { createTestingModule } from "./create-testing-module";
import { describe, expect, it } from "vitest";

describe("createTestingModule", () => {
    it("gets provider from testing module", () => {
        @Injectable()
        class ProviderStub {}

        const testingModule = createTestingModule({
            imports: [],
            providers: [ProviderStub],
        });

        expect(testingModule.get(ProviderStub)).toEqual(
            expect.any(ProviderStub)
        );
    });
});
