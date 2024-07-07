import axios from "axios";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {getAccessToken, parseResponse} from "@/uitils/helper";

const HttpMethods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
};

const _axios = axios.create();
_axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

_axios.interceptors.request.use(
    config => {
        if (!config.headers.Authorization) {
            const token = getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

_axios.interceptors.response.use(function (response) {
    return parseResponse(response);
}, function (error) {
    return parseResponse(error);
});

const setHttpConfig = (globalConfig) => {
    _axios.interceptors.request.use(
        config => {

            if (globalConfig.baseURL) {
                config.baseURL = globalConfig.baseURL;
            }

            if (globalConfig.headers) {
                config.headers = {
                    ...config.headers,
                    ...globalConfig.headers
                };
            }

            return config;
        },
        error => Promise.reject(error)
    );
}

const _useAxiosSWR = (url, options = {}) => {
    const {data, error, isLoading, mutate} = useSWR(url, async () => {
        const response = await _axios.get(url, options);
        return response.data;
    });
    return {isLoading, data, error, mutate};
};

const apiClient = {
    instance: _axios,
    setHttpConfig,
    httpMethods: HttpMethods,
    get: (url, options = {}) => _axios.get(url, options),
    post: (url, data={}, options = {}) => _axios.post(url, data, options),
    put: (url, data={}, options = {}) => _axios.put(url, data, options),
    patch: (url, data={}, options = {}) => _axios.patch(url, data, options),
    delete: (url, options = {}) => _axios.delete(url, options),
    useAxiosSWR:(url, options = {}) => _useAxiosSWR(url, options)
};

export default apiClient;