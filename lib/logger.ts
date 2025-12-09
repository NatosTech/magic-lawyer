/* eslint-disable no-console */
/**
 * Logger util para centralizar o uso de logs e evitar warnings do ESLint.
 * Por padrão, mantém logs ativos; defina LOG_SILENT=true para silenciar.
 */
const isSilenced =
  process.env.LOG_SILENT === "true" || process.env.LOG_SILENT === "1";

type LogFn = (...args: unknown[]) => void;

const createLogger = (fn: LogFn): LogFn => {
  if (isSilenced) {
    return () => {
      /* noop em produção */
    };
  }

  return (...args: unknown[]) => {
    fn(...args);
  };
};

export const logger = {
  info: createLogger(console.info.bind(console)),
  warn: createLogger(console.warn.bind(console)),
  error: createLogger(console.error.bind(console)),
  debug: createLogger(console.debug.bind(console)),
};

export default logger;
