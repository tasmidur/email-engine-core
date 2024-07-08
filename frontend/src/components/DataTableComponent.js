import DataTable from 'react-data-table-component';
import React from 'react';
import { Box, CircularProgress } from '@mui/material';
//Custom style
const customStyles = {
    rows: {
        style: {
            minHeight: '50px',
            '&:not(:last-child)': {
                borderBottom: 'none'
            },
            '&:nth-of-type(even)': {
                backgroundColor: '#F6FBFF'
            }
        }
    },
    headCells: {
        style: {
            backgroundColor: '#F4F6F8',
            fontSize: '14px',
            color: '#637381',
            padding: '22px 15px',
            borderBottom: 'none'
        }
    }
};

export default function DataTableComponent({ ...config }) {
    return (
        <div style={{ minHeight: `${config.data?.length * 50 > 800 ? 750 : config.data?.length * 50}px` }}>
            <DataTable
                progressComponent={
                    <Box sx={{ height: '100px' }}>
                        <CircularProgress />
                    </Box>
                }
                {...config}
                customStyles={customStyles}
                paginationRowsPerPageOptions={config?.paginationRowsPerPageOptions ?? [10, 15, 20, 25, 50, 75, 100, 200, 300, 400, 500]}
                fixedHeader={true}
                fixedHeaderScrollHeight="800px"
                highlightOnHover={true}
            />
        </div>
    );
}
