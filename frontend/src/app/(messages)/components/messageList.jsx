"use client";
import {useMemo} from 'react';
import DataTableComponent from "@/components/DataTableComponent";
import {Chip, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";

export default function MessageList({rows, isLoading, handleAction}) {
    const columns = useMemo(
        () => [
            {
                name: 'Subject',
                sortable: false,
                minWidth: '10%',
                selector: rows => rows?._source?.subject,
            },
            {
                name: 'Sender',
                sortable: false,
                minWidth: '20%',
                button: false,
                cell: (row) => {
                    return <Stack
                        direction="column"
                        spacing={1}
                    >
                        <Typography variant={'body1'}>{row?._source?.sender?.name}</Typography>
                        <Typography variant={'body2'}>{row?._source?.sender?.address}</Typography>
                    </Stack>
                }
            },
            {
                name: 'Sender',
                sortable: false,
                minWidth: '20%',
                button: false,
                cell: (row) => {
                    return <Stack
                        direction="column"
                        spacing={1}
                    >
                        <Typography variant={'body1'}>{row?._source?.receiver?.name}</Typography>
                        <Typography variant={'body2'}>{row?._source?.receiver?.address}</Typography>
                    </Stack>
                }
            },
            {
                name: 'Is Read',
                sortable: false,
                minWidth: '30%',
                button: true,
                cell: (row) => {
                    return <Chip label={row?._source?.isRead ? `Read` : "Not Read"}
                                 color={row?._source?.isRead ? `success` : "secondary"} variant="outlined"/>
                }
            }
        ],
        [rows]
    );
    return (
        <div>
            <DataTableComponent
                title=""
                progressPending={isLoading}
                columns={columns}
                data={rows.data}
                pagination
                paginationServer
                paginationTotalRows={rows.total}
            />
        </div>
    );
}