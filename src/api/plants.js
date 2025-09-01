import axiosInstance from "./axiosInstance";

const plantsApi = {
    getPlants: () => axiosInstance.get('/vehicles'),
    getPlantsPictures: (idPlant) => axiosInstance.get(`/images/vehicles/${idPlant}/photo`)
};

export default plantsApi;