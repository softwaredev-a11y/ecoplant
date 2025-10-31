/* eslint-disable no-undef */
import { expect } from 'vitest';
import { generateOperationHours, formatOperationHours, buildSetOperationHoursCommand, buildSetOperationHoursCommandSyrus4, getSyrus4OperationHours, isScheduleMessage, extractScheduleMessageHeader } from "../src/utils/operationHours";

describe('Operation hours utils', () => {

    describe('generateOperationHours', () => {
        it('should format the operation hour from a s3 device 24 hours', () => {
            expect(generateOperationHours({
                "RGT001": ">RGT001000000130000000000235959<",
                "RGT011": ">RGT011000000000000000000130000<",
            })).toBe("24 horas")
        })

        it('should format the operation hour from a s3 device 08:00 a.m a 08:00 p.m', () => {
            expect(generateOperationHours({
                "RGT001": ">RGT001000000130000000000235959<",
                "RGT011": ">RGT011000000000000000000010000<",
            })).toBe("08:00 a.m a 08:00 p.m")
        })

        it('should format the operation hour from a s3 device 06:00 a.m a 07:00 p.m', () => {
            expect(generateOperationHours({
                "RGT001": ">RGT001000000110000000000235959<",
                "RGT011": ">RGT001000000000000000000000000<",
            })).toBe("06:00 a.m a 07:00 p.m")
        })
    })
    describe('formatOperationHours', () => {
        it('should format the hour in string 08:00 a.m a 06:00 p.m', () => {
            expect(formatOperationHours(13, 23)).toBe("08:00 a.m a 06:00 p.m")
        })
        it('should format the hour in string 10:00 a.m a 05:00 p.m', () => {
            expect(formatOperationHours(15, 22)).toBe("10:00 a.m a 05:00 p.m")
        })
    })
    describe('buildSetOperationHoursCommand', () => {
        it('should build the command to set the operation hour in s3 device', () => {
            expect(buildSetOperationHoursCommand("7:00 a", "3:00 p")).toStrictEqual(["SGT001000000120000000000200000", "SGT011000000120000000000200000", "SGT021000000120000000000200000"])
        })
        it('should build the command to set the operation hour in s3 device', () => {
            expect(buildSetOperationHoursCommand("8:00 a", "8:00 p")).toStrictEqual(["SGT001000000130000000000235959", "SGT011000000000000000000010000", "SGT021000000130000000000235959"])
        })
    })
    describe('buildSetOperationHoursCommandSyrus4', () => {
        it('should build the command to set the operation hour in s4 devices', () => {
            expect(buildSetOperationHoursCommandSyrus4("8 a", "8 a")).toBe('SXAEC::apx-redis-cli publish user "{"start_time":"01-00-pm","end_time":"01-00-pm"}"')
        })
        it('should build the command to set the operation hour in s4 devices', () => {
            expect(buildSetOperationHoursCommandSyrus4("5 p", "10 a")).toBe('SXAEC::apx-redis-cli publish user "{"start_time":"02-00-pm","end_time":"12-00-am"}"')
        })
    })

    describe('getSyrus4OperationHours', () => {
        it('should return "24 horas" when start and end times are the same', () => {
            const message = 'RXAEC::apx-redis-cli publish user "{"start_time":"08-00-am","end_time":"08-00-am"}"';
            expect(getSyrus4OperationHours(message)).toBe("24 horas");
        });

        it('should return a formatted schedule for a standard day range', () => {
            // 1:00 PM GMT0 is 8:00 AM GMT-5. 10:00 PM GMT0 is 5:00 PM GMT-5.
            const message = 'RXAEC::apx-redis-cli publish user "{"start_time":"01-00-pm","end_time":"10-00-pm"}"';
            expect(getSyrus4OperationHours(message)).toBe("08:00 a.m a 05:00 p.m");
        });

        it('should return a formatted schedule for a range that crosses midnight', () => {
            // 10:00 PM GMT0 is 5:00 PM GMT-5. 11:00 AM GMT0 is 6:00 AM GMT-5.
            const message = 'RXAEC::apx-redis-cli publish user "{"start_time":"10-00-pm","end_time":"11-00-am"}"';
            expect(getSyrus4OperationHours(message)).toBe("05:00 p.m a 06:00 a.m");
        });

        it('should return null for an invalid or incomplete message', () => {
            const message = 'RXAEC::apx-redis-cli publish user "{"start_time":"10-00-pm"}"';
            expect(getSyrus4OperationHours(message)).toBeNull();
        });
    });
});