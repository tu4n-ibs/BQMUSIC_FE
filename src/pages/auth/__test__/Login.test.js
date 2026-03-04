import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import userService from '../../../services/userService';

// Mock userService
jest.mock('../../../services/userService');

// Mock useAuth
const mockLogin = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
    ...jest.requireActual('../../../context/AuthContext'),
    useAuth: () => ({
        login: mockLogin,
    }),
}));

const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            {component}
        </MemoryRouter>
    );
};

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login form', () => {
        renderWithRouter(<Login />);
        expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log in with Google/i })).toBeInTheDocument();
    });

    test('valid login calls userService and login context', async () => {
        const validJwtToken = 'header.eyJpZFVzZXIiOiIxMjMifQ.signature'; // {"idUser":"123"}
        const mockUserRes = {
            token: validJwtToken,
            refreshToken: 'refresh123',
            role: ['USER'],
            idUser: '123',
            email: 'test@example.com'
        };
        userService.login.mockResolvedValue(mockUserRes);

        renderWithRouter(<Login />);

        userEvent.type(screen.getByPlaceholderText(/Email/i), 'test@example.com');
        userEvent.type(screen.getByPlaceholderText(/^Password$/i), 'password123');

        const loginButtons = screen.getAllByRole('button');
        const submitButton = loginButtons.find(btn => btn.textContent === 'Log in');

        if (submitButton) {
            fireEvent.click(submitButton);
        } else {
            fireEvent.click(screen.getByText(/^Log in$/i));
        }

        await waitFor(() => {
            expect(userService.login).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                token: validJwtToken,
                refreshToken: 'refresh123',
                role: ['USER'],
                idUser: '123',
                email: 'test@example.com',
                name: undefined,
                imageUrl: undefined
            });
        });
    });

    test('invalid login shows error message', async () => {
        userService.login.mockRejectedValue({
            response: {
                data: { message: 'Login failed' }
            }
        });

        renderWithRouter(<Login />);

        userEvent.type(screen.getByPlaceholderText(/Email/i), 'wrong@test.com');
        userEvent.type(screen.getByPlaceholderText(/^Password$/i), 'wrongpass');

        const loginButtons = screen.getAllByRole('button');
        const submitButton = loginButtons.find(btn => btn.textContent === 'Log in');
        if (submitButton) fireEvent.click(submitButton);
        else fireEvent.click(screen.getByText(/^Log in$/i));

        await waitFor(() => {
            expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
        });
    });

    test('google login button exists', () => {
        renderWithRouter(<Login />);
        const googleBtn = screen.getByRole('button', { name: /Log in with Google/i });
        expect(googleBtn).toBeInTheDocument();
    });
});
