import { Token } from "../models/token.model";
import { Class } from "../types.js";
import { getTokenName } from "../utils";

export class SingleClassTokenRequiredError<T> extends Error {
    constructor(type: Token<T>, target?: Class<unknown>) {
        const targetMsg =
            target && target.name ? ` found in ${target.name}` : "";
        super(
            `Single class token must be provided for @InjectFactory. Token: ${getTokenName(
                type
            )}${targetMsg}`
        );
    }
}
