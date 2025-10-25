export class RequestContextMissingError extends Error {
  constructor(key: string) {
    super(`Missing '${key}' in request context.`);
  }
}
