import { sendLogToCliq } from '@/services/cliq.service';

/**
 * @typedef {'LOGIN_SUCCESS' | 'LOGIN_ERROR' | 'LIST_PLANTS_SUCCESS' | 'LIST_PLANTS_ERROR' | 'CALCULATE_ACCUMULATED_ERROR' | 'BUILD_SETTER_COMMAND_ERROR' | 'CHANGE_OPERATION_VALUE_ERROR' | 'SEND_COMMAND_ERROR' | 'CHECK_CONNECTION_STATUS_ERROR' | 'CONSULT_RAW_DATA_ERROR' | 'CONSULT_SYRUS_4_DATA_ERROR' | 'SEND_SETTER_COMMAND_SUCCESS' | 'SEND_COMMAND_SUCCESS'} LogType
 */

const LOG_TEMPLATES = {
    // Auth
    LOGIN_SUCCESS: 'code: AC01\naction: login_attempt\nuser: {user}\nidPlant: N/A\nmessage: Successful login',
    LOGIN_ERROR: 'code: ER01\naction: login_attempt\nuser: {user}\nidPlant: N/A\nmessage: {message}',
    // Plants
    LIST_PLANTS_SUCCESS: 'code: AC02\naction: list_plants_attempt\nuser: N/A\nidPlant: N/A\nmessage: List successful.',
    LIST_PLANTS_ERROR: 'code: ER02\naction: list_plants_attempt\nuser: N/A\nidPlant: N/A\nmessage: {message}',
    CHECK_CONNECTION_STATUS_ERROR: 'code: ER07\naction: check_connection_status(s)\nuser: N/A\nidPlant: {idPlant}\nmessage: {message}',
    CONSULT_RAW_DATA_ERROR: 'code: ER08\naction: consult_accumulated_values(s)\nuser: N/A\nidPlant: {idPlant}\nmessage: {message}',
    // Commands
    SEND_COMMAND_SUCCESS: 'code: AC05\naction: send_command\nuser: N/A\nidPlant: {idPlant}\nmessage: Command sending successful',
    SEND_COMMAND_ERROR: 'code: ER06\naction: send_command(s)\nuser: N/A\nidPlant: {idPlant}\nmessage: {message}',
    // Parameters
    SEND_SETTER_COMMAND_SUCCESS: 'code: AC04\naction: send_setter_command\nuser: {user}\nidPlant: {plantId}\nmessage: {typeOperation} cambiado(a) con exito',
    BUILD_SETTER_COMMAND_ERROR: 'code: ER04\naction: build_setter_command\nuser: {user}\nidPlant: {plantId}\nmessage: No fue posible construir el comando.',
    CHANGE_OPERATION_VALUE_ERROR: 'code: ER05\naction: change_operation_value\nuser: {user}\nidPlant: {plantId}\nmessage: {message}',
    // Accumulated Data
    CALCULATE_ACCUMULATED_ERROR: 'code: ER03\naction: calculate_accumulated_values\nuser: N/A\nidPlant: {idPlant}\nmessage: {message}',
    // Syrus 4
    CONSULT_SYRUS_4_DATA_ERROR: 'code: ER09\naction: consult_syrus_4_data(s)\nuser: N/A\nidPlant: {idPlant}\nmessage: {message}',
};

/**
 * Formatea y envía un log al servicio de Cliq.
 * @param {LogType} type - El tipo de log a enviar.
 * @param {Object.<string, string | number>} data - Los datos para rellenar la plantilla del log.
 */
export const log = async (type, data = {}) => {
    let messageTemplate = LOG_TEMPLATES[type];

    if (!messageTemplate) {
        console.error(`[Logging Service] Plantilla de log no encontrada para el tipo: '${type}'`);
        return;
    }

    // Rellena la plantilla con los datos proporcionados
    for (const key in data) {
        messageTemplate = messageTemplate.replace(new RegExp(`{${key}}`, 'g'), data[key] ?? 'N/A');
    }

    try {
        await sendLogToCliq(messageTemplate);
    } catch (error) {
        console.error(`[Logging Service] Error al enviar el log a Cliq:`, error);
    }
};

