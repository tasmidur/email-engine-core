"use client";
import * as React from "react";
import {useEffect, useState} from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MessageList from "@/app/(messages)/components/messageList";
import apiClient from "@/lib/axios";
import {apiEndpoint} from "@/uitils/static-const";
import {Divider, Paper, Stack, styled} from "@mui/material";
import useSWR from "swr";
import LayoutWrapper from "@/components/LayoutWrapper";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {io} from "socket.io-client";
import {notify, NOTIFY_MESSAGE_ERROR, NOTIFY_MESSAGE_INFO} from "@/uitils/helper";
import {useAuth} from "@/contexts/AuthContext";

const DemoPaper = styled(Paper)(({theme}) => ({
    width: 200,
    height: 50,
    padding: theme.spacing(2),
    ...theme.typography.body2,
    textAlign: "center",
    fontWeight: "bold",
}));

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const swrFetcher = ([url, options]) =>
    apiClient
        .get(url, options)
        .then((res) => {
            return res?.data;
        })
        .catch((error) => {
            return error;
        });

export default function MessagePage() {
    const {user} = useAuth();
    const [filter, setFilter] = useState({
        from: 0,
        size: 10,
    });

    const {
        data: mailMessages,
        mutate: messageMutate,
        isLoading: swrLoader,
    } = useSWR(
        [
            apiEndpoint.messages,
            {
                params: filter,
            },
        ],
        swrFetcher,
        {
            revalidateOnMount: true,
            refreshInterval: 300000,
        }
    );

    const {data: mailBoxDetails, mutate: mailBoxMutate,} = useSWR([apiEndpoint.mailBox], swrFetcher, {
        revalidateOnMount: true,
        refreshInterval: 300000
    });

    useEffect(() => {
        // Listen for incoming messages from the server
        if (user?.id) {
            socket.on(user?.id, (newMessage) => {
                //notify(`New message`, NOTIFY_MESSAGE_INFO)
                messageMutate().then(r => mailBoxMutate());
            });

            // Cleanup on unmount
            return () => {
                socket.off(user?.id);
            };
        }
    }, [user?.id]);

    const handlePageSizeChange = (pageSize) => {
        setFilter((prevState) => ({...prevState, size: pageSize}));
    };

    const handlePageChange = (page) => {
        setFilter((prevState) => ({...prevState, from: Number(page) - 1}));
    };

    return (
        <LayoutWrapper>
            <Container maxWidth="lg">
                <Box
                    sx={{
                        my: 8,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%"
                    }}
                >
                    <Typography variant="h4" component="h1" sx={{mb: 6}}>
                        Message List
                    </Typography>

                    <Stack direction="row" spacing={2} marginBottom={6}>
                        <DemoPaper variant="elevation">
                            Total Message: {mailBoxDetails?.totalMessages ?? 0}
                        </DemoPaper>
                        <DemoPaper variant="elevation">
                            Total Read
                            Message: {(mailBoxDetails?.totalMessages ?? 0) - (mailBoxDetails?.unreadMessages ?? 0)}
                        </DemoPaper>
                        <DemoPaper variant="elevation">
                            Total UnRead Message: {mailBoxDetails?.unreadMessages ?? 0}
                        </DemoPaper>
                    </Stack>
                    <Divider/>
                    <Box sx={
                        {
                            width: "100%"
                        }
                    }>
                        <MessageList
                            isLoading={swrLoader}
                            rows={mailMessages}
                            handlePageSizeChange={handlePageSizeChange}
                            handlePageChange={handlePageChange}
                        />
                    </Box>
                </Box>
            </Container>
        </LayoutWrapper>
    );
}
