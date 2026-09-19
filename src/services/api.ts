/**
 * Re-export the modular API service layer.
 * All domain services, models, and HTTP client instances are structured in ./api/
 */
export * from "./api/index"
export { api as default } from "./api/index"
