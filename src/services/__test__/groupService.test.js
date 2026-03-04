import groupService from '../groupService';
import axiosClient from '../axiosClient';

jest.mock('../axiosClient');

describe('groupService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getGroups should return fake data or empty array on error', async () => {
        // Since getGroups currently uses static mock data inside the method we just call it
        const result = await groupService.getGroups();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    test('getGroupById should return fake data or null on error', async () => {
        const result = await groupService.getGroupById(1);
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.name).toBe("Creative Hub");
    });

    test('createGroup should call correct endpoint', async () => {
        const mockData = { data: { id: 1, name: "New Group" } };
        axiosClient.post.mockResolvedValue(mockData);

        const groupData = { name: "New Group" };
        const result = await groupService.createGroup(groupData);

        expect(axiosClient.post).toHaveBeenCalledWith('/groups', groupData);
        expect(result).toEqual(mockData.data);
    });

    // --- NEW API TESTS ---

    test('joinGroup should call the new join-requests endpoint', async () => {
        const mockData = { data: { message: "Request sent" } };
        axiosClient.post.mockResolvedValue(mockData);

        const result = await groupService.joinGroup(123);

        expect(axiosClient.post).toHaveBeenCalledWith('/groups/123/join-requests');
        expect(result).toEqual(mockData.data);
    });

    test('togglePrivateGroup should call the toggle-private endpoint', async () => {
        const mockData = { data: { message: "Privacy toggled" } };
        axiosClient.put.mockResolvedValue(mockData);

        const result = await groupService.togglePrivateGroup(123);

        expect(axiosClient.put).toHaveBeenCalledWith('/groups/123/toggle-private');
        expect(result).toEqual(mockData.data);
    });

    test('togglePostApproval should call the toggle-post-approval endpoint', async () => {
        const mockData = { data: { message: "Approval toggled" } };
        axiosClient.put.mockResolvedValue(mockData);

        const result = await groupService.togglePostApproval(123);

        expect(axiosClient.put).toHaveBeenCalledWith('/groups/123/toggle-post-approval');
        expect(result).toEqual(mockData.data);
    });

    test('getJoinRequests should call the pending requests endpoint', async () => {
        const mockData = { data: [{ id: 1, status: 'PENDING' }] };
        axiosClient.get.mockResolvedValue(mockData);

        const result = await groupService.getJoinRequests(123);

        expect(axiosClient.get).toHaveBeenCalledWith('/groups/123/join-requests/pending');
        expect(result).toEqual(mockData.data);
    });

    test('reviewJoinRequest should call the review endpoint with approve parameter', async () => {
        const mockData = { data: { message: "Reviewed" } };
        axiosClient.put.mockResolvedValue(mockData);

        // Test approve = true
        let result = await groupService.reviewJoinRequest(123, 456, true);
        expect(axiosClient.put).toHaveBeenCalledWith('/groups/123/join-requests/456/review?approve=true');
        expect(result).toEqual(mockData.data);

        jest.clearAllMocks();

        // Test approve = false
        axiosClient.put.mockResolvedValue(mockData);
        result = await groupService.reviewJoinRequest(123, 456, false);
        expect(axiosClient.put).toHaveBeenCalledWith('/groups/123/join-requests/456/review?approve=false');
        expect(result).toEqual(mockData.data);
    });
});
