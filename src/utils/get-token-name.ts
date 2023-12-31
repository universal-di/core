import {InjectionToken, Token} from '../models';

export const getTokenName = <T>(token: Token<T>) => (token instanceof InjectionToken ? token.identifier : token.name);
