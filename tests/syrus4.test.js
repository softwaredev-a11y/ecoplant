/* eslint-disable no-undef */
import { expect } from 'vitest';
import { formatEcoplantVersion, getEcoplantParams, getValueParam, buildSetterCommandSyrus4, proccessSyrus4SocketMessage, getFiltrationValueFromMessage, getInvWTimeValueFromMessage, getRinseValueFromMessage, getFlowAlertValueFromMessage, getInsufficientAlarmValueFromMessage } from '../src/utils/syrus4';

describe('Syrus 4 Utility Functions:', () => {
    describe('formatEcoplantVersion', () => {
        it('should return the formatted version when the ecoplant_app is found', () => {
            expect(formatEcoplantVersion([
                { "instance_name": "__cloud_syrusjs", "app_name": "syrusjs", "version": "1.63.0" },
                { "instance_name": "__cloud_ecoplant_app", "app_name": "ecoplant_app", "version": "1.0.1" }
            ])).toBe("Ecoplant App 1.0.1 4G");
        });

        it('should return a "not found" message if the ecoplant_app is not in the list', () => {
            expect(formatEcoplantVersion([
                { "instance_name": "__cloud_syrusjs", "app_name": "syrusjs", "version": "1.63.0" }
            ])).toBe("Versión de Ecoplant no encontrada");
        });

        it('should return an "information not available" message for null input', () => {
            expect(formatEcoplantVersion(null)).toBe("Información no disponible");
        });

        it('should return a "not found" message for an empty array', () => {
            expect(formatEcoplantVersion([])).toBe("Versión de Ecoplant no encontrada");
        });
    });

    describe('getEcoplantParams', () => {
        it('should correctly parse all operation parameters from the response string', () => {
            const response = "FILTRATION_TIME 21600 INV_WASHING_TIME 120 RINSE_TIME 60 " +
                "ADC_WARNING_THRESHOLD 2506 ADC_ALARM_THRESHOLD 2106 " +
                "START_HOURS 8 END_HOURS 8";
            const mvZeroValue = 2006;

            expect(getEcoplantParams(response, mvZeroValue)).toStrictEqual({
                filtracion: "6 horas",
                retrolavado: "2 minutos",
                enjuague: "1 minuto",
                alerta: 5, // (2506 - 2006) / 100 = 5
                alarma: 1, // (2106 - 2006) / 100 = 1
                horario: "24 horas",
            });
        });
    });

    describe('getValueParam', () => {
        const responseString = "START_HOURS 8 FILTRATION_TIME 14400 INV_WASHING_TIME 120 RINSE_TIME 120 ADC_WARNING_THRESHOLD 2506 ADC_ALARM_THRESHOLD 2106 END_HOURS 8";

        it('should return the value for filtration time', () => {
            expect(getValueParam('FILTRATION_TIME', responseString)).toBe("14400");
        });

        it('should return the value for rinse time', () => {
            expect(getValueParam('RINSE_TIME', responseString)).toBe("120");
        });

        it('should return the value for inverted washing time', () => {
            expect(getValueParam('INV_WASHING_TIME', responseString)).toBe("120");
        });

        it('should return the value for warning threshold', () => {
            expect(getValueParam('ADC_WARNING_THRESHOLD', responseString)).toBe("2506");
        });

        it('should return the value for alarm threshold', () => {
            expect(getValueParam('ADC_ALARM_THRESHOLD', responseString)).toBe("2106");
        });

        it('should return the value for start hour of operation', () => {
            expect(getValueParam('START_HOURS', responseString)).toBe("8");
        });

        it('should return the value for end hour of operation', () => {
            expect(getValueParam('END_HOURS', responseString)).toBe("8");
        });

        it('should return null for a non-existent key', () => {
            expect(getValueParam('NON_EXISTENT_KEY', responseString)).toBe(null);
        });
    });

    describe('buildSetterCommandSyrus4', () => {
        it('should return the command to change the filtration value', () => {
            expect(buildSetterCommandSyrus4('65', 6, 'horas', 2006)).toBe(`SXAEC::apx-redis-cli publish user "{"fil_time":21600}"`);
        });

        it('should return the command to change the rinse value', () => {
            expect(buildSetterCommandSyrus4('12', 10, 'minutos', 2006)).toBe(`SXAEC::apx-redis-cli publish user "{"rinse_time":600}"`);
        });

        it('should return the command to change the inverted washing time value', () => {
            expect(buildSetterCommandSyrus4('32', 10, 'minutos', 2006)).toBe(`SXAEC::apx-redis-cli publish user "{"invw_time":600}"`);
        });

        it('should return the command to change the warning threshold value', () => {
            expect(buildSetterCommandSyrus4('03', 5, 'gpm', 2006)).toBe(`SXAEC::apx-redis-cli publish user "{"adc_fil_warning_thr":2506}"`);
        });

        it('should return the command to change the alarm threshold value', () => {
            expect(buildSetterCommandSyrus4('00', 1, 'gpm', 2006)).toBe(`SXAEC::apx-redis-cli publish user "{"adc_fil_alarm_thr":2106}"`);
        });
    });

    describe('proccessSyrus4SocketMessage', () => {
        const mvZeroValue = 2006;

        it('should process a filtration time message and return the formatted time', () => {
            const message = 'SXAEC::apx-redis-cli publish user "{\\"fil_time\\":21600}";0;1';
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "filtrado",
                    value: "6 horas",
                }
            );
        });

        it('should process an inverted washing time message and return the formatted time', () => {
            const message = 'SXAEC::apx-redis-cli publish user "{\\"invw_time\\":600}";0;1';
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "retrolavado",
                    value: "10 minutos",
                }
            );
        });

        it('should process a rinse time message and return the formatted time', () => {
            const message = 'SXAEC::apx-redis-cli publish user "{\\"rinse_time\\":60}";0;1';
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "enjuague",
                    value: "1 minuto",
                }
            );
        });

        it('should process a warning threshold message and return the correct GPM value', () => {
            const message = 'SXAEC::apx-redis-cli publish user "{\\"adc_fil_warning_thr\\":2506}";0;1';
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "valorAlertaFlujo",
                    value: 5, // (2506 - 2006) / 100 = 5
                }
            );
        });

        it('should process an alarm threshold message and return the correct GPM value', () => {
            const message = 'SXAEC::apx-redis-cli publish user "{\\"adc_fil_alarm_thr\\":2106}";0;1';
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "valorAlarmaInsuficiente",
                    value: 1, // (2106 - 2006) / 100 = 1
                }
            );
        });

        it('should process an operation hours message and return the formatted local time', () => {
            // El mensaje contiene horas en GMT0 (1pm = 13h, 2am = 2h)
            const message = 'RXAEC::apx-redis-cli publish user "{\\"start_time\\":\\"01-00-pm\\",\\"end_time\\":\\"02-00-am\\"}";0;1';
            // La función debe convertir a GMT-5 (13h -> 8h, 2h -> 21h) y formatear
            expect(proccessSyrus4SocketMessage(message, mvZeroValue)).toStrictEqual(
                {
                    key: "horario",
                    value: "08:00 a.m a 09:00 p.m", // 8am a 9pm
                }
            );
        });
    });


    it('should return the filtration value', () => {
        // La función espera el mensaje ya procesado, sin escapes de JSON
        const message = 'SXAEC::apx-redis-cli publish user "{"fil_time":21600}";0;1'.replace(/\\/g, '');
        expect(getFiltrationValueFromMessage(message)).toBe("6 horas")
    })

    it('should return the inv_w_time', () => {
        const message = 'SXAEC::apx-redis-cli publish user "{"invw_time":600}";0;1'.replace(/\\/g, '');
        expect(getInvWTimeValueFromMessage(message)).toBe("10 minutos")
    })

    it('should return the rinse value', () => {
        const message = 'SXAEC::apx-redis-cli publish user "{"rinse_time":60}";0;1'.replace(/\\/g, '');
        expect(getRinseValueFromMessage(message)).toBe("1 minuto")
    })

    it('should return the warning threshold value', () => {
        const message = 'SXAEC::apx-redis-cli publish user "{"adc_fil_warning_thr":2506}";0;1'.replace(/\\/g, '');
        expect(getFlowAlertValueFromMessage(message, 2006)).toBe(5)
    })

    it('should return the alarm threshold value', () => {
        const message = 'SXAEC::apx-redis-cli publish user "{"adc_fil_alarm_thr":2106}";0;1'.replace(/\\/g, '');
        expect(getInsufficientAlarmValueFromMessage(message, 2006)).toBe(1)
    })

})
