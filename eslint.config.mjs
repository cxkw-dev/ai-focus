import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier'

const config = [
  ...nextVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  eslintConfigPrettier,
  {
    ignores: ['coverage/**', 'mcp-server/dist/**'],
  },
]

export default config
