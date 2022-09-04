export default async ({
  body = {},
  headers = { 'Content-Type': 'application/json' },
  method = 'POST',
  url
}) => {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers,
    method,
    redirect: 'follow'
  });
  return response;
};
