import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://vendure.tarikrital.website/shop-api',
  documents: ['src/**/*.{ts,tsx,vue,astro}'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
    },
    './src/gql/introspection.json': {
      plugins: ['introspection'],
    },
  },
}

export default config