import Ajv, { Options } from "ajv";
import * as TJS from "typescript-json-schema";
import { ValidateResult } from './types';

let ajvInstance: Ajv | undefined;

export function Configure(iSchema: TJS.Definition): void {

    if (ajvInstance)
        throw Error("Already configured");

    const options: Options = {
        removeAdditional: "all",    // Extra properties will be removed (washed)
        useDefaults: true,
        allErrors: true
    };

    const ajv = new Ajv(options);
    ajv.addSchema(iSchema);
    ajvInstance = ajv;
}

export function GenericTypeGuard<T>(definitionName: string, candidate: unknown): candidate is T {
    return GenericValidator(definitionName, candidate).Success;
}

export function GenericValidator<T>(definitionName: string, candidate: T): ValidateResult {

    if (!ajvInstance)
        return { Success: false, Error: "Must execute Configure() first.", Errors: undefined };

    try {
        const validate = ajvInstance.getSchema(`#/definitions/${definitionName}`);
        if (validate) {
            const result = validate(candidate);
            return result ? { Success: true } : { Success: false, Error: "Schema validation Error", Errors: validate.errors ?? [] };
        }

        return { Success: false, Error: `Type not found. Name=${definitionName}`, Errors: undefined };

    } catch (error) {
        return { Success: false, Error: error.message, Errors: undefined };
    }

}

