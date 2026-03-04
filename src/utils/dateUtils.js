/**
 * Formats a date value (string, number, or array from backend) into a readable string.
 * @param {any} dateValue 
 * @returns {string}
 */
export const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';

    try {
        let date;
        if (Array.isArray(dateValue)) {
            // Handle [year, month, day, hour, minute, second] format
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
            // Month in JavaScript is 0-indexed (0-11)
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            date = new Date(dateValue);
        }

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Invalid Date';
    }
};
