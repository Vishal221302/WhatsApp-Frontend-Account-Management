import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

export const login = (credentials) => axios.post(`${API_URL}/auth/login`, credentials);

export const initSession = (sessionId) => axios.post(`${API_URL}/sessions/init`, { sessionId });
export const getSessions = () => api.get('/sessions');
export const logoutSession = (sessionId) => api.post('/sessions/logout', { sessionId });

export const getChats = (sessionId) => api.get(`/sessions/${sessionId}/chats`);
export const getMessages = (sessionId, chatId) => api.get(`/sessions/${sessionId}/chats/${chatId}/messages`);
// sendMessage now accepts content, options, and optional file
export const sendMessage = (sessionId, chatId, content, options, file) => {
    if (file) {
        const formData = new FormData();
        formData.append('chatId', chatId);
        if (content) formData.append('content', content);
        if (options) formData.append('options', JSON.stringify(options));
        formData.append('file', file);
        return api.post(`/sessions/${sessionId}/messages/send`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.post(`/sessions/${sessionId}/messages/send`, { chatId, content, options });
};
export const deleteMessage = (sessionId, chatId, messageId) => api.post(`/sessions/${sessionId}/messages/delete`, { chatId, messageId });
export const setTypingState = (sessionId, chatId, isTyping) => api.post(`/sessions/${sessionId}/chats/${chatId}/typing`, { isTyping });
export const getChatInfo = (sessionId, chatId) => api.get(`/sessions/${sessionId}/chats/${chatId}/info`);
export const groupAction = (sessionId, chatId, action, payload) => api.post(`/sessions/${sessionId}/groups/${chatId}/action`, { action, ...payload });
export const getContacts = (sessionId) => api.get(`/sessions/${sessionId}/contacts`);
export const createGroup = (sessionId, name, participants) => api.post(`/sessions/${sessionId}/groups`, { name, participants });
export const getChatMedia = (sessionId, chatId) => api.get(`/sessions/${sessionId}/chats/${chatId}/media`);
export const getStatus = (sessionId) => api.get(`/sessions/${sessionId}/status`);
export const postStatus = (sessionId, text, file = null) => {
    const formData = new FormData();
    formData.append('content', text);
    if (file) {
        formData.append('file', file);
    }
    return api.post(`/sessions/${sessionId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteStatus = (sessionId, statusId) => api.delete(`/sessions/${sessionId}/status`, { data: { statusId } });

export default api;
