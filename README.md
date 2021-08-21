# runtime-typescript-checker

This package enables *runtime* checking of TypeScript types and interfaces. TypeScript itself doesn't have this functionality, but using this code it's possible to parse the TypeScript files and generate a `json-schema`-file. This file can, in turn, be used in runtime. :)

## Build

The build step executes the following steps:

1. Read and parse TypeScript types and interfaces
2. Generate a json-schema (for detailed specifications on this format, see <http://json-schema.org>)
3. Generate and write TypeScript source code files which utilizes the json-schema

Performance note: This step costs several seconds (3+) to run and there is smart caching implemented that tries to avoid writing as far as possible.

## Generated files

A generated file will contain one or more TypeGuard and validator functions. Depending on coding style, use the one preferred. Be aware that if there's a need for details on *why* the payload doesn't work, then the `Validate*` functions must be used (TypeGuard design)

The payload must perfectly match the TypeScript definition (extra fields in a payload is automatically removed / washed).

An autogenerated file looks like:

```typescript
import { Configure, GenericTypeGuard, GenericValidator } from 'runtime-typescript-checker';
import { DancerInterface, eRole, DanceClass } from './dances';

// ** THIS FILE IS AUTOGENERATED; DO NOT CHANGE.

export { Configure };

export function ValidateDancerInterface(iCandidate: unknown): ReturnType<typeof GenericValidator> {
   return GenericValidator("DancerInterface", iCandidate);
}

export function IsDancerInterface(iCandidate: unknown): iCandidate is DancerInterface {
   return GenericTypeGuard("DancerInterface", iCandidate);
}

```

## Using the generated file

It's as easy as:

1. Load the previously generated json-schema file. There is an already prepared `Configure` function for this.
2. Run tests

```typescript
   const schema = LoadSchemaFile(iSchemaFileName);
    if (!schema)
        throw Error("Schema not found");

    // Load the JSON schema and use it to enable runtime checking
    dancevalidator.Configure(schema);
```

and then use it as with the payload as:

```typescript
   console.log(dancevalidator.ValidateeRole({ Role: "Hockeyplayer" }));
```

For more details, check out the `runtime-typescript-checker-demo`.

## Custom TypeGuards/Validators

It's possible to write a custom TypeGuard and/or validator code. Use the file `simplevalidator.ts` in this project as a template.

## Dependencies

This project had not been possible without the [Ajv JSON schema validator](https://www.npmjs.com/package/ajv) and [typescript-json-schema](https://www.npmjs.com/package/typescript-json-schema).


## More information

Check out the demo project: `runtime-typescript-checker-demo`.

Also, it's possible to run `npm run test` on this project. It's probably a good idea to edit `generateschema.test.ts` and disable the `teardown` step.

Enjoy :)

/T

