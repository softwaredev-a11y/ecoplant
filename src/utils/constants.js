/**
 * Comandos para consultar los valores de filtración, retrolavado, enjuague, alerta y alarma 
 * en dispositivos inferiores a syrus 4.
 */
export const COMMANDS = {
    FILTRATION: "QED06",
    BACKWASH: "QED14",
    RINSE: "QED34",
    FLOW_ALERT: "QXAGA03",
    INSUFFICIENT_FLOW_ALARM: "QXAGA00",
};

/**
 * Comandos para consultar información y realizar cambios en dispositivos Syrus 4.
 */
export const SYRUS_FOUR_COMMANDS = {
    //Obtiene el valor de retrolavado, filtración, enjuague alerta y alarmado de los dispositivos Syrus 4.
    GET_ECOPLANT_PARAMS: "apx-redis-cli hgetall ecoplant_params",
    //Obtiene las aplicaciones instaladas en el dispositivo. Se utiliza para obtener la versión (app_name y version, descripción y modelo).
    GET_ECOPLANT_VERSION: "syrus-apps-manager list-instances",
    //Obtiene el estado de la conexión del gps.
    GET_ECOPLANT_GPS_STATUS: "apx-gps status",
    //Permite cambiar el valor de operación de las Ecoplantas.
    //Se utiliza SXAEC para poder obtener la respuesta del servidor 
    //en el websocket.
    SET_ECOPLANT_PARAM: "SXAEC::apx-redis-cli publish user"
}

/**
 * Códigos de protocolo y cabeceras de mensaje para dispositivos inferiores a Syrus 4.
 * Se utilizan para parsear respuestas de comandos QED y para identificar errores en comandos SET.
 */
export const SYRUS3_MESSAGE_HEADERS = {
    RES_CMD_QED_FIL: 'SGC04TC',
    RES_CMD_QED_B: 'SGC07TC',
    RES_CMD_QED_R: 'SGC10TC',
    RES_CMD_QED_F_ALERT: 'RXAGA03V',
    RES_CMD_QED_F_ALARM: 'RXAGA00V',
    // Usados para identificar mensajes de error 'RER'
    RES_CMD_SET_FIL: 'SED06NA0',
    RES_CMD_SET_B: 'SED14NV0',
    RES_CMD_SET_R: 'SED34NV0',
    RES_CMD_SET_F_ALERT: 'SXAGA03',
    RES_CMD_SET_F_ALARM: 'SXAGA00',
}

/**
 * Parte de comandos que se van a utilizar para cambiar valores en los parametros de operación
 * de dispositivos syrus 4. Hacen parte de la cadena de texto que se envían como comando.
 */
export const SYRUS4_SET_PARAMETER_KEYS = {
    CMD_SET_FIL: 'fil_time',
    CMD_SET_B: 'invw_time',
    CMD_SET_R: 'rinse_time',
    CMD_SET_F_ALERT: 'adc_fil_warning_thr',
    CMD_SET_F_ALARM: 'adc_fil_alarm_thr'
}

/**
 * Cabeceras de mensajes que llegan del WebSocket.
 * REV: Cabecera que indica que el mensaje tiene información relacionado al proceso que se está ejecutando actualmente.
 * BL: No es una cabecera, hace parte del mensaje REV, e indica si existe información relacionada al flujo actual.
 * RER: Cabecera que indica que el mensaje tiene información relacionado a un error. 
 */
export const HEADER_MESSAGES_SOCKET = {
    GET_CURRENT_PROCCESS: "REV",
    GET_CURRENT_FLOW: "BL=",
    ERROR: "RER"
}

/**
 * Códigos de operación utilizados internamente en la aplicación y en las API
 * para identificar tipos de procesos (filtración, retrolavado, etc.).
 */
export const OPERATION_CODES = {
    FILTRATION: "65",
    BACKWASH: "32",
    RINSE: "12",
    FLOW_ALERT: "03",
    INSUFFICIENT_FLOW_ALARM: "00",
};

/**
 * Claves utilizadas para mapear los resultados procesados de los mensajes del socket
 * a los estados correspondientes en los hooks (ej. `useOperationParameters`).
 */
export const SOCKET_KEYS = {
    FILTRATION: "filtrado",
    BACKWASH: "retrolavado",
    RINSE: "enjuague",
    FLOW_ALERT: "valorAlertaFlujo",
    INSUFFICIENT_FLOW_ALARM: "valorAlarmaInsuficiente",
};

/**
 * Códigos de operación utilizados específicamente para la consulta de datos crudos (raw data) de acumulados.
 */
export const RAW_DATA_CODES = {
    FILTRATION: 65,
    RINSE: 32,
    BACKWASH: 12,
};
/**
 * Grupos de los usuarios de las Ecoplantas.
 */
export const ECOPLANT_GROUPS = {
    SUPER_USERS_GROUP: "123",
    DEVELOP_GROUP: "22004"
}

/**
 * Define los valores máximos permitidos para cada parámetro de operación al enviar un comando de cambio.
 * Se usa para validación en el frontend antes de enviar el comando.
 */
export const MAX_VALUE_OPERATIONS = {
    FILTRATION: 99999,
    BACKWASH: 99999,
    RINSE: 99999,
    FLOW_ALERT: 15000,
    INSUFFICIENT_FLOW_ALARM: 15000
}