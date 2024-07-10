"use client";
import {useMemo} from 'react';
import DataTableComponent from "@/components/DataTableComponent";
import {Chip, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
export default function MessageList({rows, isLoading,handlePageSizeChange, handlePageChange}) {
    const columns = useMemo(
        () => [
            {
                name: 'Subject',
                sortable: false,
                minWidth: '20%',
                cell:(row)=><><Typography variant={'body2'}>{row?._source?.subject}</Typography></>
            },
            {
                name: 'Sender',
                sortable: false,
                minWidth: '30%',
                button: false,
                cell: (row) => {
                    return <Stack
                        direction="column"
                        spacing={1}
                    >
                        <Typography variant={'body2'}>{row?._source?.sender?.name}({row?._source?.sender?.address})</Typography>
                    </Stack>
                }
            },
            {
                name: 'Receiver',
                sortable: false,
                minWidth: '30%',
                button: false,
                cell: (row) => {
                    return <Stack
                        direction="column"
                        spacing={1}
                    >
                        <Typography variant={'body2'}>{row?._source?.receiver?.name}({row?._source?.receiver?.address})</Typography>
                    </Stack>
                }
            },
            {
                name: 'Status',
                sortable: false,
                minWidth: '20%',
                button: true,
                cell: (row) => {
                    return<Stack direction="row" spacing={1}>
                        {row?._source?.isRead ? <Chip icon={<MarkEmailReadOutlinedIcon />} label="Read" color={"primary"} /> : <Chip icon={<MarkEmailUnreadOutlinedIcon />} label="Un Read" variant="outlined" color={"secondary"}/>}
                        {row?._source?.isFlagged && <Chip icon={<FlagOutlinedIcon />} color={"error"} label="Flag" />}
                    </Stack>
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
                data={rows?.data}
                pagination
                paginationServer
                paginationTotalRows={rows?.total}
                onChangeRowsPerPage={handlePageSizeChange}
                onChangePage={handlePageChange}
            />
        </div>
    );
}