// Error types that help categorize errors for users
export enum ErrorType {
  // User can fix these errors by changing their input
  USER_INPUT = "USER_INPUT",
  // User can fix these by retrying or checking their connection
  USER_ACTIONABLE = "USER_ACTIONABLE", 
  // System errors that user cannot fix
  SYSTEM_ERROR = "SYSTEM_ERROR",
  // Authentication/permission errors
  AUTH_ERROR = "AUTH_ERROR"
}
