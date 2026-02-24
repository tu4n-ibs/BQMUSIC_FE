import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import userService from '../../../services/userService';

// Mock userService
jest.mock('../../../services/userService');

const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            {component}
        </MemoryRouter>
    );
};

describe('ForgotPassword Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders initial email step', () => {
        renderWithRouter(<ForgotPassword />);
        // Updated placeholder/text based on actual component implementation
        // "Email" placeholder, "Trouble Logging In?" title
        expect(screen.getByPlaceholderText(/^Email$/i)).toBeInTheDocument();
        expect(screen.getByText(/Trouble Logging In\?/i)).toBeInTheDocument();
    });

    test('Step 1: Submits email and moves to OTP step on success', async () => {
        userService.sendOtpForgot.mockResolvedValue({ success: true });

        renderWithRouter(<ForgotPassword />);

        const emailInput = screen.getByPlaceholderText(/^Email$/i);
        const nextButton = screen.getByRole('button', { name: /Send Login Link/i });

        userEvent.type(emailInput, 'test@example.com');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(userService.sendOtpForgot).toHaveBeenCalledWith('test@example.com');
        });

        await screen.findByPlaceholderText(/Enter OTP Code/i);
    });

    test('Step 1: Shows error message on failure', async () => {
        userService.sendOtpForgot.mockResolvedValue({ success: false, message: 'User not found' });

        renderWithRouter(<ForgotPassword />);

        const emailInput = screen.getByPlaceholderText(/^Email$/i);
        const nextButton = screen.getByRole('button', { name: /Send Login Link/i });

        userEvent.type(emailInput, 'wrong@test.com');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/User not found/i)).toBeInTheDocument();
        });
    });

    test('Step 2: Submits OTP and verify success message', async () => {
        // Setup Step 2
        userService.sendOtpForgot.mockResolvedValue({ success: true });
        userService.verifyOtpForgot.mockResolvedValue({ success: true });

        renderWithRouter(<ForgotPassword />);

        // Step 1
        userEvent.type(screen.getByPlaceholderText(/^Email$/i), 'test@example.com');
        fireEvent.click(screen.getByRole('button', { name: /Send Login Link/i }));
        await screen.findByPlaceholderText(/Enter OTP Code/i);

        // Step 2
        const otpInput = screen.getByPlaceholderText(/Enter OTP Code/i);
        const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });

        userEvent.type(otpInput, '123456');
        fireEvent.click(verifyButton);

        await waitFor(() => {
            expect(userService.verifyOtpForgot).toHaveBeenCalledWith('test@example.com', '123456');
        });

        await waitFor(() => {
            // Success message "OTP Verified!"
            expect(screen.getByText(/OTP Verified!/i)).toBeInTheDocument();
        });

        await screen.findByPlaceholderText(/^New Password$/i);
    });

    test('Step 3: Resets password successfully', async () => {
        // Setup Step 3
        userService.sendOtpForgot.mockResolvedValue({ success: true });
        userService.verifyOtpForgot.mockResolvedValue({ success: true });
        userService.resetPasswordForgot.mockResolvedValue({ success: true });

        renderWithRouter(<ForgotPassword />);

        // Step 1
        userEvent.type(screen.getByPlaceholderText(/^Email$/i), 'test@example.com');
        fireEvent.click(screen.getByRole('button', { name: /Send Login Link/i }));

        // Step 2
        await screen.findByPlaceholderText(/Enter OTP Code/i);
        userEvent.type(screen.getByPlaceholderText(/Enter OTP Code/i), '123456');
        fireEvent.click(screen.getByRole('button', { name: /Verify OTP/i }));

        // Step 3
        const newPasswordInput = await screen.findByPlaceholderText(/^New Password$/i);
        const confirmPasswordInput = screen.getByPlaceholderText(/^Confirm New Password$/i);
        const resetButton = screen.getByRole('button', { name: /Reset Password/i });

        userEvent.type(newPasswordInput, 'NewPass123!');
        userEvent.type(confirmPasswordInput, 'NewPass123!');
        fireEvent.click(resetButton);

        await waitFor(() => {
            expect(userService.resetPasswordForgot).toHaveBeenCalledWith({
                email: 'test@example.com',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            });
        });

        await waitFor(() => {
            expect(screen.getByText(/Password reset successfully!/i)).toBeInTheDocument();
        });
    });

});
