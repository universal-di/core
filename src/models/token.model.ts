import {InjectionToken} from './injection-token.model';
import {Class} from "../types";

export type Token<T> = Class<T> | InjectionToken<T>;
