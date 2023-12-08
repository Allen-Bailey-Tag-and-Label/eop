export const actions = {
  migrate: async ({ request }) => {
    console.log(await request.formData());
  }
};
