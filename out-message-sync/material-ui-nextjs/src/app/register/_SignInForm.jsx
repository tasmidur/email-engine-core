"use client";
import React from 'react'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import {Grid, Card, CardContent, Button, TextField, InputAdornment, CardHeader, Typography} from '@mui/material'
import {Formik, Form, Field} from 'formik'
import * as Yup from 'yup'
import {useRouter} from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import {notify, NOTIFY_MESSAGE_ERROR, NOTIFY_MESSAGE_SUCCESS, setAuthToken, SUCCESS} from "@/uitils/helper";
import {MESSAGE_ROUTER} from "@/uitils/static-const";

//Data
const initialValues = {
    username: '',
    password: ''
}

//validation schema
let validationSchema = Yup.object().shape({
    username: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().required('Password cannot be empty'),
})

const SignInForm = () => {
    const {register} = useAuth()
    const onSubmit = async (values) => {
        const response = await register(values);
        if (response.status === 200) {
            setAuthToken({
                accessToken: response.data?.accessToken,
                refreshToken: response.data?.accessToken
            })
            notify(`Welcome ${values.username}`, NOTIFY_MESSAGE_SUCCESS)
            window.location.href = MESSAGE_ROUTER;
        } else {
            notify("Something wrong!", NOTIFY_MESSAGE_ERROR)
        }
    }

    return (
        <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={0}
            sx={{width: '500px', margin: 'auto'}}
        >
            <Grid
                item
                xs={12}
                sm={12}
                md={12}
                fullWidth={true}
                sx={{
                    width: '100%',
                }}
            >
                <Card align="center">
                    <Typography variant="h5" align="center" component={"div"} sx={{
                        marginTop: '10px'
                    }}>
                        Register
                    </Typography>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={onSubmit}
                    >
                        {(props) => {
                            const {
                                values,
                                handleChange,
                                handleBlur,
                                errors,
                                touched,
                            } = props
                            return (
                                <Form>
                                    <CardContent sx={{width: '92%', paddingLeft: '5%'}}>
                                        <Grid
                                            container
                                            spacing={1}
                                            sx={{
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >

                                            <Grid item xs={12} sm={12} md={12}>
                                                <Field
                                                    fullWidth={true}
                                                    id="username"
                                                    size="small"
                                                    label="Email Address"
                                                    variant="outlined"
                                                    helperText={touched.username && errors.username}
                                                    error={errors.username && touched.username}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    name="username"
                                                    value={values.username}
                                                    component={TextField}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment
                                                                position="end"
                                                                variant="filled"
                                                                style={{color: 'red'}}
                                                            >
                                                                {errors.username && touched.username && (
                                                                    <CancelIcon
                                                                        style={{color: 'red'}}
                                                                        fontSize="default"
                                                                    ></CancelIcon>
                                                                )}
                                                                {!errors.username && touched.username && (
                                                                    <CheckIcon
                                                                        style={{color: '#05cc30'}}
                                                                        fontSize="default"
                                                                    ></CheckIcon>
                                                                )}
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={12} md={12}>
                                                <Field
                                                    id="password"
                                                    size="small"
                                                    label="Password"
                                                    variant="outlined"
                                                    helperText={touched.password && errors.password}
                                                    error={errors.password && touched.password}
                                                    fullWidth={true}
                                                    name="password"
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    value={values.password}
                                                    type="password"
                                                    component={TextField}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment
                                                                position="end"
                                                                variant="filled"
                                                                style={{color: 'red'}}
                                                            >
                                                                {errors.password && touched.password && (
                                                                    <CancelIcon
                                                                        style={{color: 'red'}}
                                                                        fontSize="default"
                                                                    ></CancelIcon>
                                                                )}
                                                                {!errors.password && touched.password && (
                                                                    <CheckIcon
                                                                        style={{color: '#05cc30'}}
                                                                        fontSize="default"
                                                                    ></CheckIcon>
                                                                )}
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <Button
                                                    type="submit"
                                                    fullWidth={true}
                                                    variant="contained"
                                                    sx={{
                                                        mt: '8%',
                                                        mb: 1,
                                                        width: '100%',
                                                        backgroundColor: '#37cc8a',
                                                        fontSize: '80%',
                                                    }}
                                                >
                                                    Register
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Form>
                            )
                        }}
                    </Formik>
                </Card>
            </Grid>
        </Grid>
    )
}

export default SignInForm