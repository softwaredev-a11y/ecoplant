/* eslint-disable no-undef */
import { expect } from 'vitest';
import { buildDate, fillLeftText, thousandsSeparator, replaceAt, titleCase } from '../src/utils/string';

describe('String Utility Functions:', () => {
    it('should build the date', () => {
        expect(buildDate(2025, 10, 28)).toBe("2025-10-28");
    });
    it('should build the date with leading zeros in day', () => {
        expect(buildDate(2025, 10, 1)).toBe("2025-10-01");
    });
    it('should build the date with leading zeros in month', () => {
        expect(buildDate(2025, 1, 10)).toBe("2025-01-10");
    });
    it('should build the date with leading zeros', () => {
        expect(buildDate(2025, 1, 1)).toBe("2025-01-01");
    });
    it('should build a string with leading zeros', () => {
        expect(fillLeftText(15, 5)).toBe("00015")
    })
    it('should build a string with leading a', () => {
        expect(fillLeftText(15, 5, 'a')).toBe("aaa15")
    })
    it('should return the original string if it is longer than the target length', () => {
        expect(fillLeftText("123456", 5)).toBe("123456");
    });
    it('should return the original string if it has the target length', () => {
        expect(fillLeftText("12345", 5)).toBe("12345");
    });
    it('should return the num with thousand separators', () => {
        expect(thousandsSeparator(1235)).toBe("1.235")
    })
    it('should return the num without thousand separators', () => {
        expect(thousandsSeparator(135)).toBe("135")
    })
    it('should return the number with thousands and decimal separators', () => {
        expect(thousandsSeparator(1235.6)).toBe("1.235,6")
    })
    it('should modify a character with a specific index in a string', () => {
        expect(replaceAt("Hello world!", 0, 'h')).toBe("hello world!")
    })
    it('should modify a character with a specific index in a string', () => {
        expect(replaceAt("Hello world!", 0, '')).toBe("ello world!")
    })
    it('should modify a character with a specific index in a string', () => {
        expect(replaceAt("Hello world!", 0, null)).toBe("hello world!")
    })
    it('should modify a character with a specific index in a string', () => {
        expect(replaceAt("Hello world!", 15, 'a')).toBe("hello world!")
    })
    it('should capitalize at the beginning and after each space', () => {
        expect(titleCase("hola mundo")).toBe("Hola Mundo")
    })
    it('should capitalize at the beginning and after each space', () => {
        expect(titleCase("hola Mundo")).toBe("Hola Mundo")
    })
    it('should capitalize at the beginning and after each space', () => {
        expect(titleCase("Hola mundo")).toBe("Hola Mundo")
    })
    it('should return an empty string if the input is null', () => {
        expect(titleCase(null)).toBe("")
    })
});
