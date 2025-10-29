import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Use a function form so we can load env variables both in CI and locally
export default defineConfig(({ mode }) => {
  // Load .env files and process.env
  const env = loadEnv(mode, process.cwd(), '')

  // Priority: explicit VITE_BASE > GITHUB_REPOSITORY (CI) > default '/'
  const viteBase = env.VITE_BASE || ''

  let base = '/'

  if (viteBase) {
    base = viteBase.endsWith('/') ? viteBase : `${viteBase}/`
  } else {
    // Attempt to infer from GitHub repository env var (e.g. 'owner/repo')
    const ghRepo = env.GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || ''
    if (ghRepo) {
      const repoName = ghRepo.split('/')[1] || ghRepo
      base = `/${repoName}/`
    }
  }

  return {
    base,
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
  }
})