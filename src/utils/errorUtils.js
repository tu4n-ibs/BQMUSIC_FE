/**
 * Error Codes Mapping
 * Maps backend error codes to user-friendly messages.
 */
export const ERROR_CODES = {
    // AUTH / USER
    AUTH_INVALID_CREDENTIALS: "Incorrect password. Please try again.",
    AUTH_NF_001: "Account does not exist.",
    USER_NF_001: "User not found.",
    USER_NF_002: "Target user does not exist.",
    USER_NF_003: "User for this token does not exist.",
    USER_NOT_EXIST: "User does not exist.",
    USER_EXIST_001: "Username or Email already exists.",
    ROLE_NF_001: "System error: Default role not found.",
    REFRESH_TOKEN_NF: "Invalid login session. Please log in again.",
    REFRESH_TOKEN_EXPIRED: "Login session expired. Please log in again.",
    REGISTER_INVALID: "Email not verified or registration session expired.",

    // PASSWORD / OTP / EMAIL
    PASSWORD_INVALID: "Passwords do not match.",
    PASSWORD_NOT_MATCH: "Confirmation password does not match.",
    RESET_INVALID: "Password reset session invalid or expired.",
    OTP_EXIST: "Please wait 90 seconds before requesting a new OTP.",
    OTP_INVALID: "Incorrect verification code.",
    OTP_EXPIRED: "Verification code expired or does not exist.",
    SMS_EXIST: "Please wait 90 seconds before resending the message.",
    EMAIL_SEND_FAILED: "Failed to send verification email. Please try again later.",

    // SOCIAL
    FOLLOW_SELF_ERR: "You cannot follow yourself.",
    FOLLOW_EXIST_ERR: "You are already following this user.",
    FOLLOW_RELATION_NF: "You are not following this user.",
    POST_NF_001: "Post not found.",

    // FILE / SYSTEM
    FILE_UPLOAD_ERR: "Error saving new image.",
    FILE_UPLOAD_ERR_001: "Error saving image.",
    FILE_UPLOAD_ERR_002: "Error saving music file.",
    FILE_INTEGRITY_ERR: "File error: Integrity check failed.",
    FILE_HASH_ERR: "System error: Hash computation failed.",
    FILE_NF_ERR: "System error: Image file missing on server."
};

/**
 * Helper function to extract and map error message from API response
 * @param {Object} error - The error object from axios or try-catch block
 * @param {string} defaultMessage - Fallback message if no specific code is found
 * @returns {string} The user-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = "An error occurred. Please try again.") => {
    if (!error) return defaultMessage;

    let code = null;
    let message = null;
    let status = null;

    // Case 1: Axios Error Object
    if (error.response) {
        const responseData = error.response.data;
        status = error.response.status;

        if (typeof responseData === 'object') {
            code = responseData.code || responseData.errorCode;
            message = responseData.message;
        } else if (typeof responseData === 'string') {
            // Sometimes backend returns just the error code string
            code = responseData;
            message = responseData;
        }
    }
    // Case 2: Direct Response Data Object (passed from services)
    else if (error.code || error.message || error.success === false) {
        code = error.code || error.errorCode;
        message = error.message;
    }
    // Case 3: Just a string code passed
    else if (typeof error === 'string') {
        code = error;
    }

    // Check if 'code' maps to a message
    if (code && ERROR_CODES[code]) {
        return ERROR_CODES[code];
    }

    // Check if 'message' is actually a code (common in some backends)
    if (message && ERROR_CODES[message]) {
        return ERROR_CODES[message];
    }

    // Fallback to backend message if present
    if (message) {
        return message;
    }

    // Fallback to HTTP status codes
    if (status === 401) return "Login session expired or incorrect credentials.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "Requested data not found.";
    if (status === 500) return "System error. Please try again later.";

    return defaultMessage;
};
