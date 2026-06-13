// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Kysely migrations canonically receive `Kysely<any>` and import Kysely as
    // a value for that annotation — both idiomatic, neither worth fighting.
    files: ['migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off'
    }
  }
)
