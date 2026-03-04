import playlistService from '../playlistService';
import axiosClient from '../axiosClient';

jest.mock('../axiosClient');

describe('playlistService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getPlaylists should call the playlist endpoint', async () => {
        const mockData = { data: [] };
        axiosClient.get.mockResolvedValueOnce(mockData);

        const result = await playlistService.getPlaylists();

        expect(axiosClient.get).toHaveBeenCalledWith('/playlist');
        expect(result).toEqual(mockData);
    });

    test('createPlaylist should post data to the correct endpoint', async () => {
        const mockData = { success: true };
        axiosClient.post.mockResolvedValueOnce(mockData);

        const playlistData = { name: 'My Playlist', description: 'desc' };
        const result = await playlistService.createPlaylist(playlistData);

        expect(axiosClient.post).toHaveBeenCalledWith('/playlist', playlistData);
        expect(result).toEqual(mockData);
    });

    test('addSongToPlaylist should post with stringified IDs', async () => {
        const mockData = { success: true };
        axiosClient.post.mockResolvedValueOnce(mockData);

        const result = await playlistService.addSongToPlaylist(123, 456);

        expect(axiosClient.post).toHaveBeenCalledWith('/playlist/add-new-song', {
            songId: '123',
            playListId: '456'
        });
        expect(result).toEqual(mockData);
    });
});
