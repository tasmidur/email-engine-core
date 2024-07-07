import {getCookie, setCookie} from 'cookies-next';
import {ACCESS_TOKEN_KEY, HTTP_CREATED, HTTP_OK, REFRESH_TOKEN_KEY} from "@/uitils/static-const";
import {toast} from "react-toastify";
/**
 * Retrieves the authentication token from cookies.
 * @returns The authentication token or null if not found.
 */
export function getAccessToken() {
    return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return getCookie(REFRESH_TOKEN_KEY);
}

/**
 * Sets the authentication token in cookies.
 * @param token - The authentication token to be set.
 */
export function setAuthToken(token) {
    setCookie(ACCESS_TOKEN_KEY, token?.accessToken);
    setCookie(REFRESH_TOKEN_KEY, token?.refreshToken);
}

export const parseResponse = (response) => {
    const finalResponse = response?.data ?? response?.response?.data;
    return {
        status: finalResponse?.status,
        message: finalResponse?.message || finalResponse?.statusText,
        data: [HTTP_OK, HTTP_CREATED].includes(finalResponse?.status) ? (finalResponse?.data ?? {}) : {},
        errors: finalResponse?.data?.errors || []
    }
}

export const NOTIFY_MESSAGE_SUCCESS = 200;
export const NOTIFY_MESSAGE_WARNING = 422;
export const NOTIFY_MESSAGE_INFO = 100;
export const NOTIFY_MESSAGE_ERROR = 500;

export const notify = (message, statusCode) => {

    switch (statusCode) {
        case NOTIFY_MESSAGE_SUCCESS:
            toast.success(message, {
                position: "top-right",
            });
            break;
        case NOTIFY_MESSAGE_ERROR:
            toast.error(message, {
                position: "top-right"
            });
            break;
        case NOTIFY_MESSAGE_WARNING:
            toast.warn(message, {
                position: "top-right"
            });
            break;
        default:
            toast.error(message, {
                position: "top-right"
            });
    }
};