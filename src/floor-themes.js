// Floor Theme System - Visual identity for dungeon zones
// Each theme defines colors and aesthetic for a floor tier

export const THEME_OFFICE = {
    name: 'The Office',
    floors: [10, 9, 8],
    wallColor: '#aaaaaa',      // Light gray - corporate
    floorColor: '#444444',     // Dark gray
    featureColor: '#4444ff',   // Blue - water coolers, desks
    pillarColor: '#888888',    // Medium gray
    doorOpenColor: '#aa7744',  // Brown
    doorClosedColor: '#996633',// Brown
    doorLockedColor: '#ff4444' // Red
};

export const THEME_MAINTENANCE = {
    name: 'Maintenance',
    floors: [7, 6, 5],
    wallColor: '#777755',      // Gray-brown - industrial
    floorColor: '#333322',     // Dark brown
    featureColor: '#996633',   // Orange-brown - machinery, pipes
    pillarColor: '#555544',    // Dark gray-brown
    doorOpenColor: '#886633',  // Dark brown
    doorClosedColor: '#775522',// Darker brown
    doorLockedColor: '#cc4444' // Dark red
};

export const THEME_SEWERS = {
    name: 'The Sewers',
    floors: [4, 3, 2],
    wallColor: '#554433',      // Dark brown - grimy
    floorColor: '#222211',     // Very dark - decay
    featureColor: '#336633',   // Dark green - slime, grates
    pillarColor: '#443322',    // Very dark brown
    doorOpenColor: '#664422',  // Muddy brown
    doorClosedColor: '#553311',// Dark muddy brown
    doorLockedColor: '#aa3333' // Dark red
};

export const THEME_THRONE = {
    name: 'The Throne Room',
    floors: [1],
    wallColor: '#cccccc',      // White tile - clean finale
    floorColor: '#999999',     // Light gray tile
    featureColor: '#ffffff',   // White - the throne (toilet)
    pillarColor: '#aaaaaa',    // Light gray
    doorOpenColor: '#aa8866',  // Light brown
    doorClosedColor: '#997755',// Medium brown
    doorLockedColor: '#ff6666' // Bright red
};

/**
 * Get the appropriate theme for a given floor number
 * @param {number} floorNumber - Current floor (1-10, where 10 is top)
 * @returns {Object} Theme object with color properties
 */
export function getThemeForFloor(floorNumber) {
    if (floorNumber >= 8) return THEME_OFFICE;
    if (floorNumber >= 5) return THEME_MAINTENANCE;
    if (floorNumber >= 2) return THEME_SEWERS;
    return THEME_THRONE;
}

/**
 * Get theme name for display
 * @param {number} floorNumber - Current floor
 * @returns {string} Theme name
 */
export function getThemeName(floorNumber) {
    return getThemeForFloor(floorNumber).name;
}
