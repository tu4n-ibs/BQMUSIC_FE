import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [createPostModal, setCreatePostModal] = useState({
        isOpen: false,
        groupId: null
    });

    const openCreatePostModal = useCallback((options = {}) => {
        setCreatePostModal({
            isOpen: true,
            groupId: options.groupId || null
        });
    }, []);

    const closeCreatePostModal = useCallback(() => {
        setCreatePostModal({
            isOpen: false,
            groupId: null
        });
    }, []);

    return (
        <ModalContext.Provider
            value={{
                createPostModal,
                openCreatePostModal,
                closeCreatePostModal
            }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
