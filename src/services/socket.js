import { io } from "socket.io-client";

const SOCKET_URL = "https://whats-app-backend-account-managemen.vercel.app";
export const socket = io(SOCKET_URL);
