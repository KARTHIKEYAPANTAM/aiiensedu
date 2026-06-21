// Logger utility functions
export const logger = {
  log: (msg, ...args) => console.log(`[AIIENS Edu] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[AIIENS Edu] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[AIIENS Edu] ${msg}`, ...args),
};
export default logger;
