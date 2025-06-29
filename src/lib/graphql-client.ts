import { GraphQLClient } from 'graphql-request'

const VENDURE_SHOP_API_URL = 'https://vendure.tarikrital.website/shop-api'

export const graphqlClient = new GraphQLClient(VENDURE_SHOP_API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Enable cookie-based sessions
})

// Helper function to make GraphQL requests with error handling
export async function makeGraphQLRequest<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    return await graphqlClient.request<T>(query, variables)
  } catch (error) {
    console.error('GraphQL request failed:', error)
    throw error
  }
}