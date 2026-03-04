import songService from '../songService';
import axiosClient from '../axiosClient';

jest.mock('../axiosClient');

describe('songService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updateSongImage should send FormData with the image', async () => {
        const mockData = { success: true };
        axiosClient.post.mockResolvedValueOnce(mockData);

        const mockFile = new File(['dummy'], 'cover.jpg', { type: 'image/jpeg' });
        const result = await songService.updateSongImage(123, mockFile);

        expect(axiosClient.post).toHaveBeenCalledTimes(1);
        const [url, formData, config] = axiosClient.post.mock.calls[0];

        expect(url).toBe('/song/update-image?songId=123');
        expect(formData instanceof FormData).toBe(true);
        expect(formData.has('file')).toBe(true);
        expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

        expect(result).toEqual(mockData);
    });

    test('uploadSong should send FormData and encode query params', async () => {
        const mockData = { success: true };
        axiosClient.post.mockResolvedValueOnce(mockData);

        const mockFile = new File(['music'], 'song.mp3', { type: 'audio/mp3' });
        const result = await songService.uploadSong("My Song", "POP", mockFile);

        expect(axiosClient.post).toHaveBeenCalledTimes(1);
        const [url, formData, config] = axiosClient.post.mock.calls[0];

        const encodedName = encodeURIComponent("My Song");
        const encodedGenre = encodeURIComponent("POP");
        expect(url).toBe(`/song?name=${encodedName}&genreId=${encodedGenre}`);
        expect(formData instanceof FormData).toBe(true);
        expect(formData.has('file')).toBe(true);
        expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

        expect(result).toEqual(mockData);
    });

    test('getUserSongs should send pagination parameters correctly', async () => {
        const mockData = { content: [] };
        axiosClient.get.mockResolvedValueOnce(mockData);

        const result = await songService.getUserSongs(1, 0, 10);

        expect(axiosClient.get).toHaveBeenCalledWith('/song/songs/1?page=0&size=10');
        expect(result).toEqual(mockData);
    });

    test('getUserSongs should use default pagination parameters', async () => {
        const mockData = { content: [] };
        axiosClient.get.mockResolvedValueOnce(mockData);

        const result = await songService.getUserSongs(1);

        expect(axiosClient.get).toHaveBeenCalledWith('/song/songs/1?page=0&size=20');
        expect(result).toEqual(mockData);
    });

    test('getAllSongs should call the root song endpoint', async () => {
        const mockData = { content: [] };
        axiosClient.get.mockResolvedValueOnce(mockData);

        const result = await songService.getAllSongs();

        expect(axiosClient.get).toHaveBeenCalledWith('/song');
        expect(result).toEqual(mockData);
    });
});
