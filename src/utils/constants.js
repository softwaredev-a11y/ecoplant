export const COMMANDS = {
    FILTRATION: "QED06",
    BACKWASH: "QED14",
    RINSE: "QED34",
    FLOW_ALERT: "QXAGA03",
    INSUFFICIENT_FLOW_ALARM: "QXAGA00",
};

export const SYRUS_FOUR_COMMANDS = {
    //Obtiene el valor de retrolavado, filtración y enjuague de los dispositivos Syrus 4.
    GET_ECOPLANT_PARAMS: "SXAEC::apx-redis-cli hgetall ecoplant_params",
    //Obtiene las aplicaciones instaladas en el dispositivo. Se utiliza para obtener la versión (app_name y version, descripción y modelo).
    GET_ECOPLANT_VERSION: "SXAEC::syrus-apps-manager list-instances",
    //Obtiene el estado de la conexión del gps.
    GET_ECOPLANT_GPS_STATUS: "SXAEC::apx-gps status",
    //Obtiene el estado del celular.
    GET_STATUS_MOBILE: "SXAEC::apx-mdm status"
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