// Packages the built app (dist/ + electron/) as a macOS .app, zipped, for personal use.
//
//   npm run package:mac            → release/Anoko Checklist-darwin-{arm64,x64}.zip
//   ARCH=arm64 npm run package:mac → Apple Silicon only
//
// The copyrighted media and font live in git-ignored public/ folders and are bundled from
// your local copy, so the resulting app is for your own use only — don't share it.
//
// The app is ad-hoc signed (no Apple developer account), which Apple Silicon requires to
// launch at all: with `codesign` on macOS, or `rcodesign` (apple-codesign) elsewhere.
import { packager } from '@electron/packager'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const electronVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/electron/package.json'), 'utf8')).version
const arch = process.env.ARCH ? process.env.ARCH.split(',') : ['arm64', 'x64']

for (const p of ['dist/index.html', 'dist/media', 'dist/fonts']) {
  if (!existsSync(path.join(root, p))) {
    console.warn(`⚠️  ${p} is missing — put your media in public/media and the font in public/fonts (see README).`)
  }
}

const keep = ['/package.json', '/dist', '/electron']
const appPaths = await packager({
  dir: root,
  name: pkg.productName,
  executableName: pkg.productName,
  appBundleId: 'com.imwnji.anokochecklist',
  appCategoryType: 'public.app-category.productivity',
  appVersion: pkg.version,
  platform: 'darwin',
  arch,
  electronVersion,
  icon: path.join(root, 'build/icon.icns'),
  out: path.join(root, 'release'),
  overwrite: true,
  prune: false,
  asar: false,
  // Only the built web app and the Electron shell go into the bundle.
  ignore: (p) => p !== '' && !keep.some((k) => p === k || p.startsWith(k + '/')),
})

const has = (cmd) => {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

for (const dir of appPaths) {
  const appPath = path.join(dir, `${pkg.productName}.app`)
  if (process.platform === 'darwin') {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
  } else if (process.env.RCODESIGN || has('rcodesign')) {
    execFileSync(process.env.RCODESIGN || 'rcodesign', ['sign', appPath], { stdio: 'inherit' })
  } else {
    console.warn('⚠️  Not signed (no codesign/rcodesign): run `codesign --force --deep --sign -` on the Mac.')
  }

  const zip = `${dir}.zip`
  rmSync(zip, { force: true })
  if (process.platform === 'darwin') {
    execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, zip])
  } else {
    // -y keeps the framework symlinks intact
    execFileSync('zip', ['-qry', zip, `${pkg.productName}.app`], { cwd: dir })
  }
  console.log(`✓ ${path.relative(root, zip)}`)
}
