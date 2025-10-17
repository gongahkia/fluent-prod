import fontConfig from '@config/fonts.json';

/**
 * Generates Google Fonts URL from font configuration
 * @returns {string} Google Fonts URL
 */
export function generateGoogleFontsUrl() {
  const { fonts, displaySettings } = fontConfig;
  const fontFamilies = [];

  // Add primary font
  const primaryWeights = fonts.primary.weights.join(';');
  fontFamilies.push(`family=${fonts.primary.googleFontsFamily}:wght@${primaryWeights}`);

  // Add fallback fonts
  fonts.fallbacks.forEach((font) => {
    const weights = font.weights.join(';');
    fontFamilies.push(`family=${font.googleFontsFamily}:wght@${weights}`);
  });

  // Add language-specific fonts
  Object.values(fonts.languages).forEach((font) => {
    const weights = font.weights.join(';');
    fontFamilies.push(`family=${font.googleFontsFamily}:wght@${weights}`);
  });

  const url = `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=${displaySettings.display}`;
  return url;
}

/**
 * Generates font stack string from configuration
 * @param {string} stackName - Name of the font stack (sans, japanese, korean)
 * @returns {string} Font stack string
 */
export function getFontStack(stackName = 'sans') {
  const { fonts, fontStacks } = fontConfig;
  const stackConfig = fontStacks[stackName];

  if (!stackConfig) {
    console.warn(`Font stack "${stackName}" not found. Using "sans" as fallback.`);
    return getFontStack('sans');
  }

  const resolvedStack = stackConfig.stack.map((item) => {
    // Replace placeholders with actual font names
    if (item === '{primary}') {
      return `"${fonts.primary.name}"`;
    }
    if (item === '{fallbacks}') {
      return fonts.fallbacks.map((f) => `"${f.name}"`).join(', ');
    }
    if (item === '{system}') {
      return fonts.system.join(', ');
    }
    if (item.startsWith('{languages.')) {
      const langKey = item.replace('{languages.', '').replace('}', '');
      return fonts.languages[langKey] ? `"${fonts.languages[langKey].name}"` : '';
    }
    return item;
  });

  return resolvedStack.filter(Boolean).join(', ');
}

/**
 * Gets all configured fonts
 * @returns {object} Font configuration
 */
export function getFontConfig() {
  return fontConfig;
}

/**
 * Gets language-specific font information
 * @param {string} langCode - Language code (ja, ko)
 * @returns {object|null} Language font configuration
 */
export function getLanguageFont(langCode) {
  const { fonts } = fontConfig;
  const langFont = Object.values(fonts.languages).find((f) => f.langCode === langCode);
  return langFont || null;
}

/**
 * Injects Google Fonts stylesheet into document head
 */
export function loadGoogleFonts() {
  const url = generateGoogleFontsUrl();

  // Check if already loaded
  if (document.querySelector(`link[href="${url}"]`)) {
    return;
  }

  // Create and inject stylesheet link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Injects preconnect links for faster font loading
 */
export function injectPreconnect() {
  const { displaySettings } = fontConfig;

  displaySettings.preconnect.forEach((url, index) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;

    // Add crossorigin for gstatic
    if (index === 1) {
      link.crossOrigin = 'anonymous';
    }

    // Check if already exists
    if (!document.querySelector(`link[href="${url}"][rel="preconnect"]`)) {
      document.head.appendChild(link);
    }
  });
}

/**
 * Applies font CSS variables to document root
 */
export function applyFontVariables() {
  const sans = getFontStack('sans');
  const japanese = getFontStack('japanese');
  const korean = getFontStack('korean');

  const style = document.createElement('style');
  style.textContent = `
    :root {
      --font-sans: ${sans};
      --font-japanese: ${japanese};
      --font-korean: ${korean};
    }
  `;
  document.head.appendChild(style);
}

/**
 * Complete font initialization - call this once on app startup
 */
export function initializeFonts() {
  injectPreconnect();
  loadGoogleFonts();
  applyFontVariables();
}
