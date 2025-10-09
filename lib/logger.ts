/**
 * Logger util para centralizar o uso de logs e evitar warnings do ESLint.
 * Por padrão, silencia logs em produção; ajuste se quiser manter logs ativos.
 */
const isProduction = process.env.NODE_ENV === "production";

type LogFn = (...args: unknown[]) => void;

const createLogger = (fn: LogFn): LogFn => {
  if (isProduction) {
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
