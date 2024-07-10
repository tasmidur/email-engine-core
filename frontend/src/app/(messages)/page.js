"use client";
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MessageList from "@/app/(messages)/components/messageList";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { apiEndpoint, HTTP_OK } from "@/uitils/static-const";
import {
  notify,
  NOTIFY_MESSAGE_ERROR,
  NOTIFY_MESSAGE_SUCCESS,
} from "@/uitils/helper";
import io from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { Divider, Paper, Stack, styled } from "@mui/material";
import useSWR from "swr";

const DemoPaper = styled(Paper)(({ theme }) => ({
  width: 200,
  height: 50,
  padding: theme.spacing(2),
  ...theme.typography.body2,
  textAlign: "center",
  fontWeight: "bold",
}));

const swrFetcher = ([url, options]) =>
  apiClient
    .get(url, options)
    .then((res) => {
      console.log(res);
      return res?.data;
    })
    .catch((error) => {
      return error;
    });

export default function MessagePage() {
  const [filter, setFilter] = useState({
    from: 0,
    size: 10,
  });

  const {
    data: mailMessages,
    mutate,
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
      refreshInterval: 5000,
    }
  );

  const { data: mailBoxDetails } = useSWR([apiEndpoint.mailBox], swrFetcher, {
    revalidateOnMount: true,
    refreshInterval: 5000,
  });

  const handlePageSizeChange = (pageSize) => {
    setFilter((prevState) => ({ ...prevState, size: pageSize }));
  };

  const handlePageChange = (page) => {
    setFilter((prevState) => ({ ...prevState, from: Number(page) - 1 }));
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width:"100%"
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Message List
        </Typography>
        <Stack direction="row" spacing={2} marginBottom={2}>
          <DemoPaper variant="elevation">
            Total Message:{" "}
            {mailBoxDetails?.totalMessages}
          </DemoPaper>
          <DemoPaper variant="elevation">
            Total UnRead Message:{" "}
            {mailBoxDetails?.unreadMessages}
          </DemoPaper>
        </Stack>
        <Divider />
        <Box sx={
            {
                width:"100%"
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
  );
}
