"use client";
import React, {
    createContext,
    useState,
    useEffect,
    useContext, useCallback,
} from "react";

import apiClient from "@/lib/axios";
import {usePathname} from "next/navigation";
import {apiEndpoint, REGISTER_ROUTE} from "@/uitils/static-const";
import {getAccessToken} from "@/uitils/helper";


const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState({});
    const pathname = usePathname();

    const fetchUser = useCallback(async () => {
        const userInfo = await apiClient.get(apiEndpoint.user);
        const currentUser = userInfo?.data;

        if (Object.keys(currentUser).length > 0) {
            setUser(currentUser);
        }
        return currentUser;
    }, [pathname])


    useEffect(() => {
        if (getAccessToken()) {
            fetchUser();
        }
    }, [fetchUser]);

    const register = async (payload) => {
        return apiClient.post(apiEndpoint.register, payload);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                register
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
