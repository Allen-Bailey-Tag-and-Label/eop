export async function load({ url }) {
  const _id = url.searchParams.get('_id') || undefined;
  const redirect = url.searchParams.get('redirect') || undefined;
  return { _id, redirect };
}
