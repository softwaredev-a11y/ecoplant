import { useState, useMemo, useEffect, useCallback } from "react";

/**
 * Formatea una hora en formato 24h a un string en formato 12h con sufijo 'a' o 'p'.
 * @param {number} h - La hora a formatear (0-23).
 * @returns {string} La hora formateada (ej: "12 a", "3 p").
 */
const formatHour = (h) => {
    const suffix = h < 12 ? " a" : " p";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}${suffix}`;
};

/** @constant {string[]} hours - Array con las 24 horas del día en formato "1 a", "2 a", etc. */
const hours = Array.from({ length: 24 }, (value, index) => formatHour(index));

/** @constant {string[]} workingHours - Array con un subconjunto de horas que representan el horario laboral (8am a 6pm). */
const workingHours = Array.from({ length: 11 }, (value, index) => formatHour(index + 8));

const evening = Array.from({ length: 24 - 19 }, (value, index) => formatHour(index + 19));
const night = Array.from({ length: 8 }, (value, index) => formatHour(index));

/** @constant {string[]} nonWorkingHours - Array con horas que representan el horario no laboral. */
const nonWorkingHours = [...evening, ...night];

/**
 * Hook personalizado para gestionar la lógica de selección de horarios.
 *
 * Encapsula el estado y los manejadores de eventos para seleccionar rangos de horas,
 * permitiendo una lógica compleja de selección (incluyendo rangos que cruzan la medianoche)
 * y proporcionando atajos para selecciones comunes.
 *
 * @returns {{
 *  startHour: string|null,
 *  endHour: string|null,
 *  selectedHours: string[],
 *  scheduleDescription: string,
 *  handleHourClick: (hour: string) => void,
 *  clearAll: () => void,
 *  selectAll: () => void,
 *  selectWorkingHours: () => void,
 *  selectNonWorkingHours: () => void,
 *  hours: string[]
 * }}
 */
export function useSchedulePicker(currentlyValue) {
    const [selectedHours, setSelectedHours] = useState([]);
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);

    /**
     * Parsea el valor de horario actual (ej: "08:00 a.m a 05:00 p.m")
     * y establece el estado del selector.
     */
    const parseAndSetInitialState = useCallback(() => {
        const clearSelection = () => {
            setSelectedHours([]);
            setRangeStart(null);
            setRangeEnd(null);
        };

        if (!currentlyValue || typeof currentlyValue !== 'string') {
            clearSelection();
            return;
        }

        if (currentlyValue.toLowerCase() === "24 horas") {
            selectAll();
            return;
        }
        //Formatea el horario en caso de que tenga el siguiente formato:
        //##:## a.m/ p.m a ##:## a.m/p.m
        const timeRegex = /(\d{1,2}):\d{2}\s*(a\.m|p\.m)/gi;
        const matches = [...currentlyValue.matchAll(timeRegex)];

        if (matches.length !== 2) {
            clearSelection();
            return;
        }

        const [startMatch, endMatch] = matches;

        const parseHourString = (match) => {
            let hour = parseInt(match[1], 10);
            const period = match[2].toLowerCase();

            if (period === 'p.m' && hour !== 12) {
                hour += 12;
            } else if (period === 'a.m' && hour === 12) {
                hour = 0;
            }
            return formatHour(hour);
        };

        const start = parseHourString(startMatch);
        const end = parseHourString(endMatch);

        setRangeStart(start);
        setRangeEnd(end);

        const startIndex = hours.indexOf(start);
        const endIndex = hours.indexOf(end);

        if (startIndex === -1 || endIndex === -1) {
            clearSelection();
            return;
        }

        let hoursToSelect;
        if (startIndex <= endIndex) {
            hoursToSelect = hours.slice(startIndex, endIndex + 1);
        } else { // Rango que cruza la medianoche
            hoursToSelect = [...hours.slice(startIndex), ...hours.slice(0, endIndex + 1)];
        }
        setSelectedHours(hoursToSelect);
    }, [currentlyValue]);

    useEffect(() => {
        parseAndSetInitialState();
    }, [parseAndSetInitialState]);

    const startHour = rangeStart;
    const endHour = rangeEnd;

    /**
     * Maneja el evento de clic en una hora.
     * - Si no hay rango seleccionado, inicia uno nuevo.
     * - Si ya hay un inicio, completa el rango.
     * - Si el rango está completo, inicia una nueva selección.
     * @param {string} hour - La hora en la que se hizo clic (ej: "8 a").
     */
    const handleHourClick = (hour) => {
        if (rangeStart && rangeEnd) {
            setRangeStart(hour);
            setRangeEnd(null);
            setSelectedHours([hour]);
            return;
        }

        if (!rangeStart) {
            setRangeStart(hour);
            setSelectedHours([hour]);
            return;
        }

        if (rangeStart && !rangeEnd) {
            if (hour === rangeStart) {
                setRangeEnd(hour);
                setSelectedHours(hours);
                return;
            }

            setRangeEnd(hour);
            const startIndex = hours.indexOf(rangeStart);
            const endIndex = hours.indexOf(hour);

            let hoursToSelect;
            if (startIndex <= endIndex) {
                hoursToSelect = hours.slice(startIndex, endIndex + 1);
            } else {
                const hoursToEndOfDay = hours.slice(startIndex);
                const hoursFromStartOfDay = hours.slice(0, endIndex + 1);
                hoursToSelect = [...hoursToEndOfDay, ...hoursFromStartOfDay];
            }
            setSelectedHours(hoursToSelect);
        }
    };

    /**
     * Revierte la selección de horas al estado inicial basado en `currentlyValue`.
     */
    const revertToInitialState = () => {
        parseAndSetInitialState();
    };

    /**
     * Selecciona un rango de 24 horas.
     */
    const selectAll = () => {
        // Al poner la misma hora de inicio y fin, la lógica lo interpreta como 24h.
        setRangeStart(hours[8]);
        setRangeEnd(hours[8]);
        setSelectedHours(hours);
    }

    /**
     * Selecciona un rango predefinido de horas laborales.
     */
    const selectWorkingHours = () => {
        setRangeStart(hours[8]);
        setRangeEnd(hours[18]);
        setSelectedHours(workingHours);
    }

    /**
     * Selecciona un rango predefinido de horas no laborales.
     */
    const selectNonWorkingHours = () => {
        setRangeStart(hours[7]);
        setRangeEnd(hours[19]);
        setSelectedHours(nonWorkingHours);
    }

    /**
     * Genera una descripción legible del rango de horario seleccionado.
     * @type {string}
     */
    const scheduleDescription = useMemo(() => {
        const startHour = rangeStart;
        const endHour = rangeEnd;

        const is24Hours = startHour === endHour && startHour != null && endHour != null;

        return is24Hours ? "24 Horas" : `${startHour}.m a ${endHour}.m`;
    }, [rangeStart, rangeEnd]);

    return {
        startHour,
        endHour,
        rangeStart,
        rangeEnd,
        selectedHours,
        scheduleDescription,
        handleHourClick,
        revertToInitialState,
        selectAll,
        selectWorkingHours,
        selectNonWorkingHours,
        hours
    };
}
