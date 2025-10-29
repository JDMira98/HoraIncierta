import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : ''
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const basePath = isGitHubActions && repository ? `/${repository}/` : '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})