"use client";
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MessageList from "@/app/(messages)/components/messageList";
import {useCallback, useEffect, useState} from "react";
import apiClient from "@/lib/axios";
import {apiEndpoint, HTTP_OK} from "@/uitils/static-const";
import {notify, NOTIFY_MESSAGE_ERROR, NOTIFY_MESSAGE_SUCCESS} from "@/uitils/helper";
import io from 'socket.io-client';
import {useAuth} from "@/contexts/AuthContext";
import {Divider, Paper, Stack, styled} from "@mui/material";

const DemoPaper = styled(Paper)(({ theme }) => ({
    width: 200,
    height: 50,
    padding: theme.spacing(2),
    ...theme.typography.body2,
    textAlign: 'center',
    fontWeight: 'bold',
}));

const socket = io('http://localhost:3019'); // Replace with your server URL
export default function MessagePage() {
    const [messages, setMessages] = useState({});
    const [mailBox, setMailBox] = useState({});
    const [socketMessage, setSocketMessage] = useState({});
    const [muted, setMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const {user} = useAuth()

    const [filter, setFilter] = useState({
        from: 0,
        size: 10
    });

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        await fetchMailBox();
        await fetchMessages();
        setIsLoading(false);
    }, [filter,socketMessage]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    useEffect(() => {
        // Listen for incoming messages from the server
        if (user?.id) {
            socket.on(user?.id, (newMessage) => {
                console.log(newMessage)
                console.log(`New message from Socket...`,user?.id)
                notify(`New message from Socket...`, NOTIFY_MESSAGE_ERROR)
                setSocketMessage(JSON.parse(newMessage));
            });

            // Cleanup on unmount
            return () => {
                socket.off(user?.id);
            };
        }
    }, [user?.id]);

    const fetchMessages = async () => {
        const response = await apiClient.get(apiEndpoint.messages, {
            params: filter
        });
        if (response.status === HTTP_OK) {
            setMessages(response.data);
        } else {
            notify(`Something went wrong`, NOTIFY_MESSAGE_SUCCESS)
        }
    }

    const fetchMailBox = async () => {
        const response = await apiClient.get(apiEndpoint.mailBox);
        if (response.status === HTTP_OK) {
            setMailBox(response.data[0]??{});
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
                <Stack direction="row" spacing={2} marginBottom={2}>
                    <DemoPaper variant="elevation">Total Message: {mailBox?._source?.totalMessages}</DemoPaper>
                    <DemoPaper variant="elevation">Total UnRead Message: {mailBox?._source?.unreadMessages}</DemoPaper>
                </Stack>
                <Divider/>
                <Box sx={{width: "100%"}}>
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
