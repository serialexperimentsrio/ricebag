import { build } from 'esbuild'
import cssModulesPlugin from 'esbuild-css-modules-plugin'
import { execSync } from 'child_process'
import { rmSync } from 'fs'

// Clean dist
rmSync('dist', { recursive: true, force: true })

const sharedOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  sourcemap: true,
  target: 'es2020',
  jsx: 'automatic',
  metafile: true,
  plugins: [
    cssModulesPlugin({
      force: true,
      inject: true,
      localsConvention: 'camelCaseOnly',
    }),
  ],
}

await Promise.all([
  build({
    ...sharedOptions,
    format: 'esm',
    outfile: 'dist/index.js',
  }),
  build({
    ...sharedOptions,
    format: 'cjs',
    outfile: 'dist/index.cjs',
  }),
])

// Generate type declarations via tsc (skip CSS module type errors)
execSync('npx tsc --emitDeclarationOnly --declaration --declarationMap --outDir dist --skipLibCheck', {
  stdio: 'inherit',
})

console.log('Build complete')
