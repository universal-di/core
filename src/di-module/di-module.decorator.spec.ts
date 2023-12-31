import {Module} from './di-module.decorator';
import {describe, expect, it} from 'vitest';

describe('DIModuleDecorator', () => {
    it.each([{}, { imports: [] }, { providers: [] }, { imports: [], providers: [] }])(
        'creates di module with config',
        moduleConfig => {
            expect(() => {
                @Module(moduleConfig)
                class TestModule {}
            }).not.toThrow();
        },
    );

    it('throws for invalid module config', () => {
        expect(() => {
            @Module({
                controllers: [],
            } as any)
            class TestModule {}
        }).toThrow("Invalid property 'controllers' passed into the @DIModule() decorator.");
    });

    it('creates nested di module', () => {
        expect(() => {
            @Module({
                imports: [],
                providers: [],
            })
            class TestModule {}

            @Module({
                imports: [TestModule],
                providers: [],
            })
            class NestedModule {}
        }).not.toThrow();
    });
});
