export const COMMANDS = {
    FILTRATION: "QED06",
    BACKWASH: "QED14",
    RINSE: "QED34",
    FLOW_ALERT: "QXAGA03",
    INSUFFICIENT_FLOW_ALARM: "QXAGA00",
};

export const SYRUS_FOUR_COMMANDS = {
    //Obtiene el valor de retrolavado, filtración, enjuague alerta y alarmado de los dispositivos Syrus 4.
    GET_ECOPLANT_PARAMS: "apx-redis-cli hgetall ecoplant_params",
    //Obtiene las aplicaciones instaladas en el dispositivo. Se utiliza para obtener la versión (app_name y version, descripción y modelo).
    GET_ECOPLANT_VERSION: "syrus-apps-manager list-instances",
    //Obtiene el estado de la conexión del gps.
    GET_ECOPLANT_GPS_STATUS: "apx-gps status",
    //Permite cambiar el valor de operación de las Ecoplantas.
    SET_ECOPLANT_PARAM: "apx-redis-cli publish user"
}

export const HEADER_MESSAGES_SOCKET = {
    GET_CURRENT_PROCCESS: "REV",
    GET_CURRENT_FLOW: "BL="
}

export const OPERATION_CODES = {
    FILTRATION: "65",
    BACKWASH: "32",
    RINSE: "12",
    FLOW_ALERT: "03",
    INSUFFICIENT_FLOW_ALARM: "00",
};

export const SOCKET_KEYS = {
    FILTRATION: "filtrado",
    BACKWASH: "retrolavado",
    RINSE: "enjuague",
    FLOW_ALERT: "valorAlertaFlujo",
    INSUFFICIENT_FLOW_ALARM: "valorAlarmaInsuficiente",
};

export const RAW_DATA_CODES = {
    FILTRATION: 65,
    RINSE: 32,
    BACKWASH: 12,
};

export const ECOPLANT_GROUPS = {
    SUPER_USERS_GROUP: "123",
    DEVELOP_GROUP: "22004"
}

export const MAX_VALUE_OPERATIONS = {
    FILTRATION: 99999,
    BACKWASH: 99999,
    RINSE: 99999,
    FLOW_ALERT: 15000,
    INSUFFICIENT_FLOW_ALARM: 15000
}