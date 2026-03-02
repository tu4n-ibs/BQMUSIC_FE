const IMAGE_BASE_URL = 'http://localhost:8080';
const DEFAULT_AVATAR_URL = "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg?w=360";

export const getUserAvatar = (imageUrl) => {
    if (!imageUrl) return DEFAULT_AVATAR_URL;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${IMAGE_BASE_URL}${imageUrl}`;
};
