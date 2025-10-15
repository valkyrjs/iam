import route from "./route.ts";

export default route.handle(async ({ session, user }) => {
  return { session, user };
});
