/**
 * Formats a date value (string, number, or array from backend) into a readable string.
 * @param {any} dateValue 
 * @param {boolean} includeTime
 * @returns {string}
 */
export const formatDate = (dateValue, includeTime = false) => {
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

        if (includeTime) {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
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
