import { isAuthenticated as isSessionAuthenticated } from "@/utils/TokenService";

export const isAuthenticated = () => isSessionAuthenticated();
