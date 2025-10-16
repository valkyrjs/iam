import route from "./route.ts";

export default route.handle(async ({ session, user, principal }) => {
  return { session, user, principal };
});
