import {ClassProvider} from '../models/provider.model';
import {getTokenName} from '../utils';

export class NotInjectableError<T> extends Error {
    constructor(provider: ClassProvider<T>) {
        super(
            `Cannot provide ${getTokenName(provider.provide)} using class ${getTokenName(
                provider.useClass,
            )}:${getTokenName(provider.useClass)} is not injectable!`,
        );
    }
}
