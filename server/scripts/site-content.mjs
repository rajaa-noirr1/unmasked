// Loads the website's built-in content (client/src/data + the Kurdish overlays), merged the way the
// site merges them. Used to build the seed, and by the tests to check the database serves the same.
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

const client = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'client')

export async function loadSiteContent() {
  const esbuild = createRequire(join(client, 'package.json'))('esbuild')
  const tmp = mkdtempSync(join(tmpdir(), 'unmasked-content-'))
  const out = join(tmp, 'content.mjs')
  try {
    await esbuild.build({
      stdin: {
        contents: "export { dataFor } from './src/i18n/data.js'; export * as REHEARSE from './src/data/rehearse.js'",
        resolveDir: client, loader: 'js',
      },
      bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', logLevel: 'error',
      nodePaths: [join(client, 'node_modules')],
      define: { 'import.meta.env.BASE_URL': '"/"', 'import.meta.env.MODE': '"pages"' },
      banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
    })
    return await import(pathToFileURL(out).href)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
