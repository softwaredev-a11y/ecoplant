import axiosInstance from "./axiosInstance";

/**
 * Objeto que agrupa las llamadas a la API relacionadas a las Ecoplantas.
 * @property {function(object): Promise} getPlants - Obtiene listado de plantas asociadas al usuario.
 * @property {function(int):Promise} getPlantsPictes - Obtiene la foto de la Ecoplanta seleccionada.
 * @property {function(long):Promise} getConectionStatus - Obtiene los parámetros relacionados a la conexión del dispositivo seleccionado.
 * @property {function(String, String, int, int):Promise} getRawData - Obtiene los valores relacionados a los eventos de filtración, retrolavado, y enjuague.
 */

/**
 * Objeto que agrupa las llamadas a la API relacionadas con las Ecoplantas.
 * @property {function(object): Promise<AxiosResponse>} getPlants - Obtiene el listado de plantas asociadas al usuario.
 * @property {function(number): Promise<AxiosResponse>} getPlantsPictures - Obtiene la foto de la Ecoplanta seleccionada.
 * @property {function(string): Promise<AxiosResponse>} getConnectionStatus - Obtiene el estado de conexión del dispositivo.
 * @property {function(string, string, number, number): Promise<AxiosResponse>} getRawData - Obtiene datos crudos de eventos para una planta.
 * @property {function(number, string): Promise<AxiosResponse>} commandExecution - Envía un comando a un dispositivo.
 */
const plantsApi = {
    /**
     * Obtiene el listado de plantas asociadas al usuario, dependiendo de su tipo (normal, superuser).
     * @param {object} params - Los datos que determinan que grupo de plantas le corresponden al usuario.
     * @returns {Promise} - Una promesa con la respuesta de la API.
     */
    getPlants: (params) => axiosInstance.get('/vehicles?set=100&page=1', { params }),

    /**
     * Obtiene la foto de la Ecoplanta seleccionada.
     * @param {int} idPlant - ID de la planta seleccionada.
     * @returns {object} - Foto de la Ecoplanta.
     */
    getPlantsPictures: (idPlant) => axiosInstance.get(`/images/vehicles/${idPlant}/photo`),

    /**
     * Obtiene la información relacionada al estado de conexión del dispositivo.
     * @param {long} imei - Imei de la planta. Se encuentra en {plant.device} del listado de plantas. 
     * @returns {Promise} - Una promesa con la respuesta de una API.
     */
    getConectionStatus: (imei) => axiosInstance.get(`/devices/${imei}`),

    /**
     * Obtiene el valor de eventos en un período de tiempo, relacionados a procesos como filtración, retrolavado y enjuague.
     * Estos valores se usan para calcular los acumulados.
     * @param {string} startDate - Fecha de inicio para la consulta. Formato: `YYYY-MM-DD`.
     * @param {string} endDate - Fecha final para la consulta. Formato: `YYYY-MM-DD`.
     * @param {number} idPlant - ID de la Ecoplanta.
     * @param {number} command - Código del proceso a consultar. Ej: `65` (filtración), `32` (retrolavado), `12` (enjuague).
     * @returns {Promise} Una promesa que resuelve con los datos crudos de los eventos.
     */
    getRawData: (startDate, endDate, idPlant, command) => axiosInstance.get(`/rawdata?from=${startDate}T00%3A00%3A00&to=${endDate}T23%3A59%3A59&vehicles=${idPlant}&fields=code,promedio_adc:@ad,ad,count:1&tz=America/Bogota&resample=event_time&freq=1M&group_by=vid&how=promedio_adc:mean,count:sum&codes=${command}`),

    /**
     * Envía la solicitud POST para la ejecución del comando a un dispostivo.
     * @param {int} idDevice - ID del dispositivo. 
     * @param {String} command - Comando que se quiere ejecutar en la consola. 
     * @returns 
     */
    commandExecution: (idDevice, command) => axiosInstance.post(`/vehicles/${idDevice}/remote/console`, { cmd: command, includeImei: true }),
};

export default plantsApi;