
import * as assert from 'assert';
import { describe, it } from 'mocha';
import { GenerateSchemaFile } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_FILE_NAME = path.join(__dirname, "test-schema.json");
const SOURCE_TYPE_FILE_NAME = path.join(__dirname, "test1.types.ts");
const DEST_FILE_NAME = path.join(__dirname, "test1.types.v.ts");

describe('GenerateSchemaFiles', function () {
    this.timeout(15000);

    it('Test source file should exist', function () {
        assert.ok(fs.existsSync(SOURCE_TYPE_FILE_NAME), "Missing test source file");
    });

    it('GenerateSchemaFiles should return true', function () {

        const result = GenerateSchemaFile({
            SourceFilePaths: [SOURCE_TYPE_FILE_NAME],
            SchemaFilePath: SCHEMA_FILE_NAME,
            Prefix: "",
            Suffix: ".v"
        });

        assert.ok(result.Success, "GenerateSchemaFiles failed");

    });

    it('Schema file should exist', function () {
        assert.ok(fs.existsSync(SCHEMA_FILE_NAME), "Missing schema file");
    });

    it('Validation file should exist', function () {
        assert.ok(fs.existsSync(DEST_FILE_NAME), "Missing validation file");
    });

    after('Teardown', function () {

        if (fs.existsSync(SCHEMA_FILE_NAME))
            fs.rmSync(SCHEMA_FILE_NAME);

        if (fs.existsSync(DEST_FILE_NAME))
            fs.rmSync(DEST_FILE_NAME);

    });
});

