"use client";
import {Paper} from '@mui/material'
import {useState} from "react";
import SignInForm from "@/app/register/_SignInForm";

const Background = {
    backgroundColor: '#fff',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
}

const SignInPage = () => {
    return (
        <Paper
            style={Background}
            square={true}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                m: 1,
                marginTop: '10px',
                width: '98%',
                height: 'auto',
                minHeight: 500,
            }}
            elevation={0}
        >
            <SignInForm/>
        </Paper>
    )
}

export default SignInPage