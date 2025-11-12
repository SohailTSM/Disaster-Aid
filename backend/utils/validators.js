const isPoint = (loc) => loc && loc.type === 'Point' && Array.isArray(loc.coordinates) && loc.coordinates.length === 2;
module.exports = { isPoint };
