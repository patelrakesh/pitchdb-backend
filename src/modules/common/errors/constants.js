const errorConstants = {

  // General errors
  UNEXPECTED: "An unexpected error occured, if it persists, contact the administrator",

  // Auth errors
  AUTH_EMAIL_EXISTS: "There is a user already registered with that email, you must choose another one",
  AUTH_USER_NOT_FOUND: "There is no user registered with that account",

  // Email lookup verification APIs
  LOOKUP_EMAIL_CHECKER: "Error getting verification data",
  STATUS_FAILED_SEND_LOOKUP: 522,

  // Email account errors
  EMAIL_ACCOUNT_ERROR: "Email account error",
  STATUS_EMAIL_ACCOUNT_ERROR: 530,

  // Used status codes
  STATUS_BAD_REQUEST: 400,
  STATUS_FORBIDDEN: 403,
  STATUS_UNAUTHORIZED: 401,
  STATUS_NOT_FOUND: 404,
  STATUS_PAYMENT_REQUIRED: 402,

  STATUS_INTERNAL_SERVER_ERROR: 500
  
}

module.exports = errorConstants;