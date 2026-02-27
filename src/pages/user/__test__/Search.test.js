import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import { ThemeProvider } from '../../../context/ThemeContext';
import Search from '../Search';
import axiosClient from '../../../services/axiosClient';

jest.mock('../../../services/axiosClient', () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
}));

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    {component}
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Search Component', () => {
    beforeEach(() => {
        axiosClient.get.mockResolvedValue({ data: [] });
    });

    test('renders search title and input', () => {
        renderWithProviders(<Search />);
        expect(screen.getByRole('heading', { name: /search/i, level: 1 })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for songs, artists, albums...')).toBeInTheDocument();
    });

    test('renders category tabs', () => {
        renderWithProviders(<Search />);
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Songs')).toBeInTheDocument();
        expect(screen.getByText('Albums')).toBeInTheDocument();
    });

    test('renders recent searches section by default', () => {
        renderWithProviders(<Search />);
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    });
});
