import {Token} from '../models/token.model';
import {Class} from '../types';
import {getTokenName} from '../utils';

export class NoProviderForTypeError<T> extends Error {
    constructor(type: Token<T>, target?: Class<unknown>) {
        const targetMsg = target && target.name ? ` found in ${target.name}` : '';
        super(`No provider for ${getTokenName(type)}${targetMsg}`);
    }
}
