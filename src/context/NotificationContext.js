import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const clientRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await notificationService.getAllNotifications();
            const notifList = response?.data?.content || response?.data || response || [];
            setNotifications(notifList);
            setUnreadCount(notifList.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Error fetching initial notifications:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && user?.idUser) {
            fetchNotifications();

            const client = new Client({
                brokerURL: `${process.env.REACT_APP_API_BASE_URL?.replace('http', 'ws')}/ws`,
                connectHeaders: {},
                debug: function (str) {
                    // console.log(str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.webSocketFactory = () => new SockJS(`${process.env.REACT_APP_API_BASE_URL}/ws`);

            client.onConnect = (frame) => {
                client.subscribe(`/user/${user.idUser}/queue/notifications`, (message) => {
                    const newNotif = JSON.parse(message.body);
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    toast(`${newNotif.user || 'Notification'}: ${newNotif.text || newNotif.content || 'New interaction'}`, {
                        icon: '🔔',
                        duration: 5000
                    });
                });
            };

            client.onStompError = (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            };

            client.activate();
            clientRef.current = client;

            return () => {
                if (clientRef.current) {
                    clientRef.current.deactivate();
                }
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user?.idUser, fetchNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev => prev.map(n =>
                (n.id === notificationId || n.notificationId === notificationId)
                    ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
