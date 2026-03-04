import axiosClient from '../axiosClient';
import axios from 'axios';

describe('axiosClient interceptors', () => {
    let mockStorage = {};

    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage = {};

        // Mock localStorage using spies
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key]);
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { mockStorage[key] = value; });
        jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => { mockStorage = {}; });
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete mockStorage[key]; });

        // Mock window.location
        delete window.location;
        window.location = { href: '' };

        // Real axios post for interceptor retry mock
        axios.post = jest.fn();
    });

    test('should add Authorization header if token exists', () => {
        const requestInterceptor = axiosClient.interceptors.request.handlers[0].fulfilled;
        mockStorage['token'] = 'mock-token';

        const config = { headers: {} };
        const result = requestInterceptor(config);

        expect(result.headers['Authorization']).toBe('Bearer mock-token');
    });

    test('should not add Authorization header if no token', () => {
        const requestInterceptor = axiosClient.interceptors.request.handlers[0].fulfilled;
        const config = { headers: {} };
        const result = requestInterceptor(config);

        expect(result.headers['Authorization']).toBeUndefined();
    });

    test('response success interceptor should just return response', () => {
        const responseSuccessInterceptor = axiosClient.interceptors.response.handlers[0].fulfilled;
        const mockResponse = { data: 'ok' };
        expect(responseSuccessInterceptor(mockResponse)).toBe(mockResponse);
    });

    test('response error interceptor should reject on non-401 error', async () => {
        const responseErrorInterceptor = axiosClient.interceptors.response.handlers[0].rejected;

        const mockError = {
            config: {},
            response: { status: 404 }
        };

        await expect(responseErrorInterceptor(mockError)).rejects.toEqual(mockError);
    });
});
