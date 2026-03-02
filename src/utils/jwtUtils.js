/**
 * Utility to parse JWT token without external libraries
 * @param {string} token 
 * @returns {object|null}
 */
export const parseJwt = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const payload = JSON.parse(jsonPayload);
        console.log("Decoded JWT Payload:", payload);
        return payload;
    } catch (e) {
        console.error("Error parsing JWT:", e);
        return null;
    }
};

/**
 * Extract numeric ID from JWT payload
 * @param {string} token 
 * @returns {string|number|null}
 */
export const getUserIdFromToken = (token) => {
    const payload = parseJwt(token);
    if (!payload) return null;

    // Common claims for user ID
    // sub is often used for the main identifier
    const userId = payload.userId || payload.id || payload.idUser || payload.sub;
    console.log("Extracted User ID from Token:", userId);
    return userId;
};
