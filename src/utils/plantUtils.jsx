export function getPlantModel(text) {
    const match = text.match(/\*type:Ecoplant\s*(\d+)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 'Sin información disponible';
}
