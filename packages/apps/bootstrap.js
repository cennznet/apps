// Bootstrap wasm modules early in the JS dependency graph
// so later modules can import as normal
import('./src/index.tsx')
  .catch(err => `error loading doughnut wasm: ${err}`);
