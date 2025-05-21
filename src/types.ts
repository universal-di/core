export type Class<T = any> = new (...args: any[]) => T;

export type Optional<T> = T | undefined;

export type SingleOrArray<T> = T | T[];
