export type Hooks = {
  /**
   * Executes when any error is thrown before or during the lifetime
   * of the route. This allows for custom handling of errors if the
   * route has unique requirements to error handling.
   *
   * @param error - Error which has been thrown.
   */
  onError?: (error: unknown) => Response;
};
