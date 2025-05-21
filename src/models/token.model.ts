import { Class } from "../types.js";
import { InjectionToken } from "./injection-token.model";

export type Token<T> = Class<T> | InjectionToken<T>;
