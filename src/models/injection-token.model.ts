// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class InjectionToken<T = unknown> {
    constructor(readonly identifier: string) {
        if (!/^[a-zA-Z-_]+$/g.test(identifier)) {
            throw new Error('Invalid injection token value');
        }
    }
}
