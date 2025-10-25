export class DatabaseInsertError extends Error {
  override readonly name = "DatabaseInsertError";

  constructor(readonly resource: string) {
    super(`Expected to insert a '${resource}', but none was created.`);
  }
}
