import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(tsx|mdx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    // Allow importing files from monorepo root (examples/*.slide)
    config.server = config.server || {}
    // @ts-ignore
    config.server.fs = {
      strict: false,
      allow: [
        path.resolve(__dirname, '../../..'),
        path.resolve(__dirname, '../../../examples'),
        process.cwd(),
      ]
    }
    return config
  }
}
export default config
