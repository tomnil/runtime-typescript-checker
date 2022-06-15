
import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import * as TJS from "typescript-json-schema";
import * as crypto from "crypto";
import { ISchemaFile, LoadOrGenerateArgs } from './types';


export * from './types';
export * from './simplevalidator';

export function GenerateSchemaFile(args: LoadOrGenerateArgs): { Success: true, Files: string[] } | { Success: false, Error: string } {

    let schemaFile: ISchemaFile = fs.existsSync(args.SchemaFilePath) ? JSON.parse(fs.readFileSync(args.SchemaFilePath, 'utf-8')) : { SuperHash: "", Schema: undefined };
    const newSuperHash = CalculateFilesSuperHash(args.SourceFilePaths);

    if (args.CustomValidatorFilePath && !fs.existsSync(args.CustomValidatorFilePath))
        return { Success: false, Error: `Could not find validator. Path=${args.CustomValidatorFilePath}` };

    if (args.ForceGenerate || schemaFile.SuperHash !== newSuperHash) {

        //  Start tsc
        const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };
        const program = TJS.getProgramFromFiles(args.SourceFilePaths, compilerOptions, ".");       // "." = basePath, might need to be changed.
        const settings: TJS.PartialArgs = { required: true };

        // Generate schema
        const schema = TJS.generateSchema(program, "*", settings);

        if (!schema?.definitions)
            return { Success: false, Error: "TJS.generateSchema failed" };

        // *********************************************
        // * Generate symbols
        // *********************************************

        const generator = TJS.buildGenerator(program, settings);

        if (!generator)
            return { Success: false, Error: "TJS.buildGenerator failed" };

        // *********************************************
        // * Connect files with generated symbols
        // *********************************************

        const symbolPerFile: { AbsolutePath: string, Name: string, Symbols: TJS.SymbolRef[] }[]
            = args.SourceFilePaths.map(name => ({ AbsolutePath: path.resolve(name), Name: name, Symbols: [] }));
        for (const mySymbol of generator.getSymbols()) {

            let nodeObject: ts.Node | undefined = mySymbol.symbol.declarations?.[0];  // eslint-disable-line @typescript-eslint/no-explicit-any
            while (nodeObject?.parent)
                nodeObject = nodeObject.parent;

            const sourceFile = nodeObject as ts.SourceFile;

            if (sourceFile.isDeclarationFile)   // Ignore nodejs files
                continue;

            // @ts-ignore
            if (!mySymbol.symbol.parent)        // No parent? Then it's not exported...
                continue;

            const match = symbolPerFile.find(item => item.AbsolutePath === path.resolve(sourceFile.fileName));
            if (match)
                match.Symbols.push(mySymbol);
        }

        // *********************************************
        // * Write files to disk, if needed
        // *********************************************

        const writtenFiles: string[] = [];
        for (const f of symbolPerFile) {
            const writtenFile = WriteTSFile(
                f.AbsolutePath,
                args.Prefix,
                args.Suffix ?? ".v",
                f.Symbols,
                args.CustomValidatorFilePath ?? "runtime-typescript-checker",
                args.ForceGenerate ?? false);

            if (writtenFile)
                writtenFiles.push(writtenFile);
        }

        // *********************************************
        // * Store schema file for runtime use
        // *********************************************

        if (args.SchemaFilePath) {
            schemaFile = { SuperHash: newSuperHash, Schema: schema };
            fs.writeFileSync(args.SchemaFilePath, JSON.stringify(schemaFile, null, 4));
        }

        return { Success: true, Files: writtenFiles };
    }

    return { Success: true, Files: [] };
}

export function LoadSchemaFile(iSchemaFilePath: string): TJS.Definition | undefined {

    const schemaFile: ISchemaFile = fs.existsSync(iSchemaFilePath) ? JSON.parse(fs.readFileSync(iSchemaFilePath, 'utf-8')) : { SuperHash: "", Schema: undefined };
    return schemaFile.Schema;

}



function WriteTSFile(iTargetFileName: string, iPrefix: string | undefined, iSuffix: string | undefined, iSymbolRef: TJS.SymbolRef[], iPathToValidator: string, iForce: boolean): string | undefined {

    const justPath = path.dirname(iTargetFileName);
    const nameWithoutExtension = path.basename(iTargetFileName, path.extname(iTargetFileName));
    const destinationFilename = path.join(justPath, `${iPrefix}${nameWithoutExtension}${iSuffix}.ts`)
    const baseValidatorPath = iPathToValidator === "runtime-typescript-checker" ? iPathToValidator : path.relative(path.dirname(iTargetFileName), iPathToValidator).split(path.sep).join(path.posix.sep);

    if (path.relative(iTargetFileName, destinationFilename) === "")
        throw Error("Source file and destination file has the same filename. Check Prefix and/or Suffix parameter.");

    // Calculate hash of current file
    let currentHash: string | undefined = undefined;
    if (fs.existsSync(destinationFilename))
        currentHash = crypto.createHash("sha256").update(fs.readFileSync(destinationFilename)).digest("hex");

    // Build content
    const tsFile: string[] = [];
    tsFile.push(`import { Configure, GenericTypeGuard, GenericValidator } from '${baseValidatorPath}';`);
    tsFile.push(`import { ${iSymbolRef.map(s => s.name).join(", ")} } from './${path.basename(nameWithoutExtension)}';`);
    tsFile.push(``);
    tsFile.push(`// ** THIS FILE IS AUTOGENERATED; DO NOT CHANGE.`);
    tsFile.push(``);

    tsFile.push(`export { Configure };`);
    tsFile.push(``);

    for (const symbol of iSymbolRef) {

        tsFile.push(`export function Validate${symbol.name}(iCandidate: unknown): ReturnType<typeof GenericValidator> {`);
        tsFile.push(`   return GenericValidator("${symbol.name}", iCandidate);`);
        tsFile.push(`}`);
        tsFile.push(``);
        tsFile.push(`export function Is${symbol.name}(iCandidate: unknown): iCandidate is ${symbol.name} {`);
        tsFile.push(`   return GenericTypeGuard("${symbol.name}", iCandidate);`);
        tsFile.push(`}`);
        tsFile.push(``);
    }

    // If it's changed, then write file
    if (iForce || currentHash !== crypto.createHash("sha256").update(tsFile.join("\r\n")).digest("hex")) {
        fs.writeFileSync(destinationFilename, tsFile.join("\r\n"), 'utf-8');
        return destinationFilename;
    }

    return undefined;
}


function CalculateFilesSuperHash(iDefinitionFiles: string[]) {

    const result: string[] = [];
    for (const file of iDefinitionFiles)
        result.push(crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"));

    // Combine all found hashes and hash again :)
    result.sort();
    return crypto.createHash("sha256").update(result.join(";")).digest("hex");

}