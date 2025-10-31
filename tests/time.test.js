/* eslint-disable no-undef */
import { expect } from 'vitest';
import { getFormattedTime, getTime, formatHour12, toGMT0, convertTo24h, toGMT5 } from '../src/utils/time';

describe('time utils functions', () => {
    describe('getFormattedTime', () => {
        it('should return the time in hours', () => {
            expect(getFormattedTime('horas', 10)).toBe('10 horas')
        });
        it('should return the time in minutes', () => {
            expect(getFormattedTime('minutos', 1)).toBe('1 minuto')
        });
        it('should return the time in seconds', () => {
            expect(getFormattedTime('segundos', 600)).toBe('10 minutos')
        });
        it('should return the time in hh-mm-ss', () => {
            expect(getFormattedTime('segundos', 25650)).toBe('7 horas 7 minutos y 30 segundos')
        });
        it('should return the time in hours and seconds when minutes are zero', () => {
            expect(getFormattedTime('segundos', 21610)).toBe('6 horas y 10 segundos');
        });
        it('should return the time in mm-ss', () => {
            expect(getFormattedTime('segundos', 650)).toBe('10 minutos y 50 segundos')
        });
    })

    describe('getTime', () => {
        it('should return the minutes in seconds', () => {
            expect(getTime('minutos', 10)).toBe(600)
        })
        it('should return the hours in seconds', () => {
            expect(getTime('horas', 6)).toBe(21600)
        })
    })

    describe('formatHour12', () => {
        it('should return the hour in 12 hours format', () => {
            expect(formatHour12(21)).toBe("09")
        })
        it('should return the hour in 12 hours format', () => {
            expect(formatHour12(20)).toBe("08")
        })
        it('should return the hour in 12 hours format', () => {
            expect(formatHour12(14)).toBe("02")
        })
        it('should return the hour in 12 hours format', () => {
            expect(formatHour12(12)).toBe("12")
        })
    })

    describe('toGMT0', () => {
        it('should return the hour in GMT0 format', () => {
            expect(toGMT0(3)).toBe("08")
        })
        it('should return the hour in GMT0 format', () => {
            expect(toGMT0(4)).toBe("09")
        })
        it('should return the hour in GMT0 format', () => {
            expect(toGMT0(1)).toBe("06")
        })
    })
    describe('convertTo24h', () => {
        it('should convert a PM hour to 24h format', () => {
            expect(convertTo24h("10 p.m")).toBe(22);
        });
        it('should convert an AM hour to 24h format', () => {
            expect(convertTo24h("10 a.m")).toBe(10);
        });
        it('should convert 12 PM (midday) to 12', () => {
            expect(convertTo24h("12 p.m")).toBe(12);
        });
        it('should convert 12 AM (midnight) to 0', () => {
            expect(convertTo24h("12 a.m")).toBe(0);
        });
        it('should handle single-digit hours', () => {
            expect(convertTo24h("1 p.m")).toBe(13);
        });
    });

    describe('toGMT5', () => {
        it('should convert a morning GMT0 hour to GMT-5', () => {
            expect(toGMT5(10)).toBe(5);
        });
        it('should convert an afternoon GMT0 hour to GMT-5', () => {
            expect(toGMT5(21)).toBe(16);
        });
        it('should handle hours that cross midnight', () => {
            expect(toGMT5(3)).toBe(22); // 3 AM GMT0 is 10 PM GMT-5 of the previous day
        });
    });
});