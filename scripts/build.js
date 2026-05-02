/**
 * build.js — bundles the Express app into dist/server.js using esbuild.
 *
 * Native modules (sharp, mysql2, bcryptjs, etc.) are kept external
 * so node_modules must still be installed on the target server via:
 *   cd dist && npm ci --omit=dev
 *
 * Usage:
 *   node scripts/build.js
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ── 1. Clean dist/ ────────────────────────────────────────────────────────────
if (fs.existsSync(DIST)) {
  try {
    fs.rmSync(DIST, { recursive: true, force: true });
  } catch (err) {
    // On Windows EPERM may occur if files are locked. Try to move the folder
    // out of the way instead of failing immediately so build can continue.
    console.warn(`Could not remove dist folder: ${err.message}`);
    const backup = `${DIST}-old-${Date.now()}`;
    try {
      fs.renameSync(DIST, backup);
      console.log(`Renamed existing dist -> ${backup}`);
    } catch (err2) {
      console.error(`Failed to rename existing dist folder: ${err2.message}`);
      console.error('Please stop any running node/nodemon processes or remove the dist folder manually and retry.');
      process.exit(1);
    }
  }
}
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'logs'), { recursive: true });

// ── 2. Bundle with esbuild ────────────────────────────────────────────────────
esbuild
  .build({
    entryPoints: [path.join(ROOT, 'cluster.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    packages: 'external',   // keep all node_modules external
    outfile: path.join(DIST, 'server.js'),
    minify: false,           // keep readable for debugging in production
    sourcemap: false,
    logLevel: 'info',
  })
  .then(() => {
    // ── 3. Copy deploy artefacts ─────────────────────────────────────────────
    const filesToCopy = ['package.json', 'package-lock.json', '.env'];
    for (const file of filesToCopy) {
      const src = path.join(ROOT, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(DIST, file));
        console.log(`Copied ${file} → dist/${file}`);
      }
    }

    // Update package.json in dist to point main to server.js
    const pkgPath = path.join(DIST, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.main = 'server.js';
    pkg.scripts = {
      start: 'node server.js',
      'start:cluster': 'NODE_ENV=production node server.js',
    };
    // Remove devDependencies from dist package.json
    delete pkg.devDependencies;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Updated dist/package.json');

    // ── 4. Generate prebuilt swagger.json for the bundled server
    try {
      const swagger = require(path.join(ROOT, 'src', 'config', 'swagger'));
      const outSwagger = path.join(DIST, 'swagger.json');
      fs.writeFileSync(outSwagger, JSON.stringify(swagger, null, 2));
      console.log('Wrote prebuilt swagger.json → dist/swagger.json');
    } catch (e) {
      console.warn('Could not generate swagger.json during build:', e.message);
    }

    console.log('\n✓ Build complete → dist/');
    console.log('  Deploy steps:');
    console.log('    cd dist');
    console.log('    npm ci --omit=dev');
    console.log('    node server.js');
  })
  .catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
