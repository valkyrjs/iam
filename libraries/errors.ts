export class ResourceNotFoundError extends Error {
  constructor(kind: string) {
    super(`Resource '${kind}' does not exist.`);
  }
}
