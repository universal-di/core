import { Class } from "../types.js";
import { Token } from "./token.model";

interface BaseProvider<T> {
    provide: Token<T>;
    multi?: boolean;
}

export interface ClassProvider<T> extends BaseProvider<T> {
    useClass: Class<T>;
}

export interface ValueProvider<T> extends BaseProvider<T> {
    useValue: T;
}

export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | Class<T>;
