import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const packageJsonPath = path.resolve( __dirname, 'package.json' );
const distPackageJsonPath = path.resolve( __dirname, 'dist/package.json' );

const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );

// Update entry points for the `dist` version
packageJson.main = './cjs/index.js';       // CommonJS entry
packageJson.module = './esm/index.js';     // ESM entry
packageJson.types = './types/index.d.ts';  // Types entry

// Adjust exports field for both import and require
packageJson.exports = {
    ".": {
        "import": "./esm/index.js",
        "require": "./cjs/index.js"
    }
};

// Remove the "type" field for compatibility with both CJS and ESM
delete packageJson.type;

// Write the updated `package.json` file to `dist`
fs.writeFileSync( distPackageJsonPath, JSON.stringify( packageJson, null, 2 ), 'utf8' );

console.log( "Single package.json created successfully in dist with type removed." );
