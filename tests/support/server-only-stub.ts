// Vitest stand-in for `import 'server-only'`. Next.js resolves that import itself (it fails the
// build when a client bundle pulls in a server module); plain Node has no such package.
export {}
