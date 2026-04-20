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
    ignores: [
      'coverage/**',
      'mcp-server/dist/**',
      'design_handoff_focus_design_system/**',
    ],
  },
]

export default config
