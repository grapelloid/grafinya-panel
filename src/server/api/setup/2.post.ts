import { readValidatedBody } from 'nuxt/server';

import * as setupSteps from '#server/features/setup';
import { defineSetupEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/http/validation';
import { UserSetupSchema } from '#shared/contracts/user';

export default defineSetupEventHandler(2, async ({ event }) => {
  const { username, password } = await readValidatedBody(
    event,
    validateZod(UserSetupSchema, event)
  );

  // Host and port are detected automatically; the request host is a fallback.
  await setupSteps.createAdministrator(
    username,
    password,
    event.req.headers.get('host')
  );
  return { success: true };
});
