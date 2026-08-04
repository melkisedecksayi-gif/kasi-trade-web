const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug;

const formatMessage = (level, context, message, data) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
};

const logger = {
  setUISideEffect: null,

  registerUI(fn) {
    logger.setUISideEffect = fn;
  },

  debug(context, message, data) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(...formatMessage('debug', context, message, data));
    }
  },

  info(context, message, data) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(...formatMessage('info', context, message, data));
    }
  },

  warn(context, message, data) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(...formatMessage('warn', context, message, data));
    }
  },

  error(context, message, data) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(...formatMessage('error', context, message, data));
      if (logger.setUISideEffect) {
        try {
          logger.setUISideEffect('error', message);
        } catch (e) {}
      }
    }
  },

  toast(context, type, message) {
    if (logger.setUISideEffect) {
      try {
        logger.setUISideEffect(type, message);
      } catch (e) {}
    }
  },
};

export default logger;
