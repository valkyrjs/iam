import { chalk } from "./chalk.ts";
import { type Level, logLevel } from "./level.ts";

export class Logger {
  #level: Level = "info";
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  get #prefix(): [string?] {
    if (this.#config.prefix !== undefined) {
      return [chalk.bold(chalk.green(this.#config.prefix))];
    }
    return [];
  }

  /**
   * Set the highest logging level in the order of debug, info, warn, error.
   *
   * When value is 'info', info, warn and error will be logged and debug
   * will be ignored.
   *
   * @param value Highest log level.
   */
  level(value: Level): this {
    this.#level = value;
    return this;
  }

  /**
   * Returns a new logger instance with the given name as prefix.
   *
   * @param name - Prefix name.
   */
  prefix(name: string): Logger {
    return new Logger({ prefix: name, loggers: this.#config.loggers }).level(this.#level);
  }

  /**
   * Emit a debug message to terminal.
   */
  debug(...args: any[]) {
    if (this.#isLevelEnabled(0)) {
      console.log(new Date(), chalk.bold("Debug"), ...this.#prefix, ...args.map(this.#toFormattedArg));
    }
  }

  /**
   * Emit a info message to terminal.
   */
  info(...args: any[]) {
    if (this.#isLevelEnabled(1)) {
      console.log(new Date(), chalk.bold(chalk.blue("Info")), ...this.#prefix, ...args.map(this.#toFormattedArg));
    }
  }

  /**
   * Emit a warning message to terminal.
   */
  warn(...args: any[]) {
    if (this.#isLevelEnabled(2)) {
      console.log(new Date(), chalk.bold(chalk.orange("Warning")), ...this.#prefix, ...args.map(this.#toFormattedArg));
    }
  }

  /**
   * Emit a errpr message to terminal.
   */
  error(...args: any[]) {
    if (this.#isLevelEnabled(3)) {
      console.log(new Date(), chalk.bold(chalk.red("Error")), ...this.#prefix, ...args.map(this.#toFormattedArg));
    }
  }

  #isLevelEnabled(level: 0 | 1 | 2 | 3): boolean {
    return level >= logLevel[this.#level];
  }

  #toFormattedArg = (arg: any): string => {
    for (const logger of this.#config.loggers) {
      const res = logger(arg, this.#level);
      if (res !== undefined) {
        return res;
      }
    }
    return arg;
  };
}

type Config = {
  prefix?: string;
  loggers: ((arg: any, level: Level) => any)[];
};
