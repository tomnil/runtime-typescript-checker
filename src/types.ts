import { ErrorObject } from "ajv";
import { Definition } from "typescript-json-schema";

export interface ISchemaFile {
    SuperHash: string,
    Schema?: Definition,
}


export type LoadOrGenerateArgs = {
    /**
     * List of files with exported types and interfaces.
     * Recommended use is relative paths, ex ".\model\everything.d.ts";
     */
    SourceFilePaths: string[],
    /**
     * Use a custom validator. See the simplevalidator.ts for information about the
     * functions that needs to be implemented.
     */
    CustomValidatorFilePath?: string | undefined,
    /**
     * The processed files will generate a schema (used in runtime).
     */
    SchemaFilePath: string,
    /**
     * Set to true to disable hash checks.
     */
    ForceGenerate?: boolean | undefined,
    /**
     * Generated files will be named as ${prefix}${sourceFileName}${suffix}${extension}
     */
    Prefix?: string | undefined,
    /**
     * Generated files will be named as ${prefix}${sourceFileName}${suffix}${extension}
     */
    Suffix?: string | undefined
}

export type ValidateResult = { Success: true } | { Success: false, Error: string, Errors: ErrorObject[] | undefined };

export { ErrorObject };
