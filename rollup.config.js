import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/cjs/index.js',
            format: 'cjs',
            sourcemap: true,
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript( {
                tsconfig: './tsconfig.rollup.json',
                useTsconfigDeclarationDir: true
            } )
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/esm/index.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript( {
                tsconfig: './tsconfig.rollup.json',
                useTsconfigDeclarationDir: true
            } )
        ]
    }
];
