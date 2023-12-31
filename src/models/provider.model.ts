import {Token} from './token.model';
import {Class} from "../types";

export interface BaseProvider<T> {
    provide: Token<T>;
    multi?: boolean;
}

export type ClassProvider<T> = BaseProvider<T> & {
    useClass: Class<T>;
}

export type ValueProvider<T> = BaseProvider<T> & {
    useValue: T;
}

export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | Class<T>;
