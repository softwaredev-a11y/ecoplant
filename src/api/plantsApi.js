import axiosInstance from "./axiosInstance";

const plantsApi = {
    getPlants: () => axiosInstance.get('/vehicles'),
    getPlantsPictures: (idPlant) => axiosInstance.get(`/images/vehicles/${idPlant}/photo`),
    getConectionStatus: (imei) => axiosInstance.get(`/devices/${imei}`),
    commandExecution: (idDevice, command) => axiosInstance.post(`/vehicles/${idDevice}/remote/console`, { cmd: command, includeImei: true }),
};

export default plantsApi;