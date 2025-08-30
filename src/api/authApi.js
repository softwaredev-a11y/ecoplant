import axiosInstance from "./axiosInstance";

const authApi = {
    login: (data) => axiosInstance.post("/login", data),
    logout: () => axiosInstance.get('/logout')
};

export default authApi;