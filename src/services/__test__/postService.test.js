import postService from '../postService';
import axiosClient from '../axiosClient';

jest.mock('../axiosClient');

describe('postService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getAllPosts should call test-find-all-post endpoint with correct exact params', async () => {
        const mockData = { data: { content: [{ id: 1, content: "Test Post" }] } };
        axiosClient.get.mockResolvedValue(mockData);

        const result = await postService.getAllPosts(1, 10);

        expect(axiosClient.get).toHaveBeenCalledWith('/posts/test-find-all-post?page=1&size=10');
        expect(result).toEqual(mockData); // Notice getAllPosts historically returns the raw axios response in this service
    });

    test('createPost should send plain json if no imageFile is provided', async () => {
        const mockData = { data: { success: true } };
        axiosClient.post.mockResolvedValue(mockData);

        const postData = { content: "No image", visibility: "PUBLIC" };
        const result = await postService.createPost(postData);

        expect(axiosClient.post).toHaveBeenCalledWith('/posts', postData);
        expect(result).toEqual(mockData);
    });

    test('createPost should use FormData if imageFile is provided', async () => {
        const mockData = { data: { success: true } };
        axiosClient.post.mockResolvedValue(mockData);

        const postData = { content: "With image", visibility: "PRIVATE" };
        const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });

        const result = await postService.createPost(postData, mockFile);

        // Verify it was called with FormData and multipart headers
        expect(axiosClient.post).toHaveBeenCalledTimes(1);
        const [url, formData, config] = axiosClient.post.mock.calls[0];

        expect(url).toBe('/posts');
        expect(formData instanceof FormData).toBe(true);
        expect(formData.has('post')).toBe(true);
        expect(formData.has('image')).toBe(true);
        expect(config).toEqual({
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        expect(result).toEqual(mockData);
    });

    test('createGroupPost should call group endpoint with plain json or FormData', async () => {
        const mockData = { data: { success: true } };

        // Test without image
        axiosClient.post.mockResolvedValueOnce(mockData);
        const postData = { content: "Group post", visibility: "PRIVATE" };
        let result = await postService.createGroupPost("grp123", postData);
        expect(axiosClient.post).toHaveBeenCalledWith('/posts/group/grp123', postData);
        expect(result).toEqual(mockData);

        // Test with image
        axiosClient.post.mockClear();
        axiosClient.post.mockResolvedValueOnce(mockData);
        const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });
        result = await postService.createGroupPost("grp123", postData, mockFile);

        expect(axiosClient.post).toHaveBeenCalledTimes(1);
        const [url, formData, config] = axiosClient.post.mock.calls[0];
        expect(url).toBe('/posts/group/grp123');
        expect(formData instanceof FormData).toBe(true);
        expect(formData.has('post')).toBe(true);
        expect(formData.has('image')).toBe(true);
        expect(config).toEqual({
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        expect(result).toEqual(mockData);
    });

    // --- SHARE POST ---
    test('sharePost should call the share endpoint with correct body', async () => {
        const mockData = { data: { success: true, message: "Post shared successfully" } };
        axiosClient.post.mockResolvedValue(mockData);

        const shareData = {
            originalPostId: "123",
            content: "Check this out",
            visibility: "PUBLIC",
            contextType: "PROFILE",
            contextId: null
        };

        const result = await postService.sharePost(shareData);

        expect(axiosClient.post).toHaveBeenCalledWith('/posts/share', shareData);
        expect(result).toEqual(mockData);
    });

    // --- GET USER POSTS ---
    test('getUserPosts should call the /posts/user/{userId} endpoint with pagination/sort', async () => {
        const mockData = { data: { content: [{ id: 1, content: "User Post 1" }] } };
        axiosClient.get.mockResolvedValue(mockData);

        const result = await postService.getUserPosts("123", 1, 5, "id,asc");

        expect(axiosClient.get).toHaveBeenCalledWith('/posts/user/123?page=1&size=5&sort=id,asc');
        expect(result).toEqual(mockData);
    });

    test('getUserPosts should use default parameters if not provided', async () => {
        const mockData = { data: { content: [] } };
        axiosClient.get.mockResolvedValue(mockData);

        const result = await postService.getUserPosts("123");

        expect(axiosClient.get).toHaveBeenCalledWith('/posts/user/123?page=0&size=10&sort=createdAt,desc');
        expect(result).toEqual(mockData);
    });

    // --- GET POST BY ID ---
    test('getPostById should call the /posts/post/{postId} endpoint', async () => {
        const mockData = { data: { id: "post123", content: "Detailed Post" } };
        axiosClient.get.mockResolvedValue(mockData);

        const result = await postService.getPostById("post123");

        expect(axiosClient.get).toHaveBeenCalledWith('/posts/post/post123');
        expect(result).toEqual(mockData);
    });
});
