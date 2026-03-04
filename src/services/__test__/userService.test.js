import axiosClient from "../axiosClient";
import userService from "../userService";

jest.mock("../axiosClient");

describe("userService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("sendOtpRegister", () => {
        it("should call axiosClient.post with correct email", async () => {
            const email = "test@example.com";
            const mockResponse = { data: { success: true, message: "OTP sent" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.sendOtpRegister(email);

            expect(axiosClient.post).toHaveBeenCalledWith(`/user/send-otp?email=${email}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("verifyOtpRegister", () => {
        it("should call axiosClient.post with correct email and otp", async () => {
            const email = "test@example.com";
            const otp = "123456";
            const mockResponse = { data: { success: true, message: "OTP verified" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.verifyOtpRegister(email, otp);

            expect(axiosClient.post).toHaveBeenCalledWith(`/user/verifi?email=${email}&otp=${otp}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("register", () => {
        it("should call axiosClient.post with user data", async () => {
            const userData = {
                name: "Test User",
                password: "password123",
                rePassword: "password123",
                email: "test@example.com"
            };
            const mockResponse = { data: { success: true, message: "Register success" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.register(userData);

            expect(axiosClient.post).toHaveBeenCalledWith("/user/register", userData);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("sendOtpForgot", () => {
        it("should call axiosClient.post with correct email", async () => {
            const email = "test@example.com";
            const mockResponse = { data: { success: true, message: "OTP sent" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.sendOtpForgot(email);

            expect(axiosClient.post).toHaveBeenCalledWith(`/user/send-otp-fp?email=${email}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("verifyOtpForgot", () => {
        it("should call axiosClient.post with correct email and otp", async () => {
            const email = "test@example.com";
            const otp = "123456";
            const mockResponse = { data: { success: true, message: "OTP verified" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.verifyOtpForgot(email, otp);

            expect(axiosClient.post).toHaveBeenCalledWith(`/user/confirm-otp-fp?email=${email}&otp=${otp}`);
            expect(result).toEqual(mockResponse.data);
        });
    });
    describe("getUserById", () => {
        it("should call axiosClient.get with correct userId", async () => {
            const userId = "123";
            const mockResponse = { data: { name: "Test User" } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await userService.getUserById(userId);

            expect(axiosClient.get).toHaveBeenCalledWith(`/user/userId/${userId}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("getUserByEmail", () => {
        it("should call axiosClient.get with correct email", async () => {
            const email = "test@example.com";
            const mockResponse = { data: { name: "Test User" } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await userService.getUserByEmail(email);

            expect(axiosClient.get).toHaveBeenCalledWith(`/user/${email}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("updateUser", () => {
        it("should call axiosClient.put with correct userId and formData", async () => {
            const userId = "123";
            const formData = new FormData();
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await userService.updateUser(userId, formData);

            expect(axiosClient.put).toHaveBeenCalledWith(`/user/userId/${userId}`, formData, expect.any(Object));
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("login", () => {
        it("should call axiosClient.post with credentials", async () => {
            const credentials = { email: "test@example.com", password: "password123" };
            const mockResponse = { data: { token: "token123" } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.login(credentials);

            expect(axiosClient.post).toHaveBeenCalledWith("/auth", credentials);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("changePassword", () => {
        it("should call axiosClient.post with password data", async () => {
            const pwdData = { email: "test@example.com", oldPassword: "old", newPassword: "new", confirmPassword: "new" };
            const mockResponse = { data: { success: true } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.changePassword(pwdData);

            expect(axiosClient.post).toHaveBeenCalledWith("/user/change-password", pwdData);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("updateImage", () => {
        it("should call axiosClient.post with formData and file", async () => {
            const file = new File(["test"], "test.png", { type: "image/png" });
            const mockResponse = { data: { success: true } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.updateImage(file);

            expect(axiosClient.post).toHaveBeenCalledWith("/user/update-image", expect.any(FormData), expect.any(Object));
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("updateName", () => {
        it("should call axiosClient.post with name query param", async () => {
            const name = "New Name";
            const mockResponse = { data: { success: true } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await userService.updateName(name);

            expect(axiosClient.post).toHaveBeenCalledWith(expect.stringContaining(`/user/update-name?name=${encodeURIComponent(name)}`));
            expect(result).toEqual(mockResponse.data);
        });
    });
});
