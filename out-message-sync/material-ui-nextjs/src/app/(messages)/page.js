"use client";
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import NextLink from 'next/link';
import ProTip from '@/components/ProTip';
import Copyright from '@/components/Copyright';
import MessageList from "@/app/(messages)/components/messageList";
import {useCallback, useEffect, useState} from "react";
import apiClient from "@/lib/axios";
import {apiEndpoint, HTTP_OK} from "@/uitils/static-const";
import {notify, NOTIFY_MESSAGE_ERROR} from "@/uitils/helper";

export default function MessagePage() {
    const [messages, setMessages] = useState({});
    const [muted, setMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [filter, setFilter] = useState({
        from: 0,
        size: 10
    });

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        await fetchMessages();
        setIsLoading(false);
    }, [filter]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    const fetchMessages = async () => {
        const response = await apiClient.get(apiEndpoint.messages, {
            params: filter
        });
        if (response.status === HTTP_OK) {
            setMessages(response.data);
        } else {
            notify(`Something went wrong`, NOTIFY_MESSAGE_ERROR)
        }
    }

    const handleAction = (action, id) => {
        console.log(action, id);
    }


    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    my: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" component="h1" sx={{mb: 2}}>
                    Message List
                </Typography>
                <Box sx={{width:"100%"}}>
                    <MessageList
                        isLoading={isLoading}
                        rows={messages}
                        handleAction={handleAction}
                    />
                </Box>
            </Box>
        </Container>
    );
}
