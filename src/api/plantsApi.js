import axiosInstance from "./axiosInstance";

const plantsApi = {
    getPlants: (params) => axiosInstance.get('/vehicles?groups=123&set=100&page=1', params),
    getPlantsPictures: (idPlant) => axiosInstance.get(`/images/vehicles/${idPlant}/photo`),
    getConectionStatus: (imei) => axiosInstance.get(`/devices/${imei}`),
    getRawData: (startDate, endDate, idPlant, command) => axiosInstance.get(`/rawdata?from=${startDate}T00%3A00%3A00&to=${endDate}T23%3A59%3A59&vehicles=${idPlant}&fields=code,promedio_adc:@ad,ad,count:1&tz=America/Bogota&resample=event_time&freq=1M&group_by=vid&how=promedio_adc:mean,count:sum&codes=${command}`),
    commandExecution: (idDevice, command) => axiosInstance.post(`/vehicles/${idDevice}/remote/console`, { cmd: command, includeImei: true }),
};

export default plantsApi;