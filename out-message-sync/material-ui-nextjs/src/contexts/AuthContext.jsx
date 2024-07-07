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


const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState({});
    const pathname = usePathname();

    const fetchUser = useCallback(async () => {
        const userInfo = await apiClient.get(apiEndpoint.user);
        const currentUser = userInfo?.data;
        if (currentUser) {
            setUser(currentUser);
        }
        return currentUser;
    }, [pathname])


    useEffect(() => {
        fetchUser()
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
