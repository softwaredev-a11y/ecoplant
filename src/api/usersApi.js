import axiosInstance from "./axiosInstance";

const usersApi = {
    getUser: () => axiosInstance.get('/user')
}

export default usersApi;