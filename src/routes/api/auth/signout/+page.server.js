import 'dotenv/config';
import { serialize } from 'cookie';

export async function POST({ request, setHeaders }) {
  setHeaders({
    'Set-Cookie': serialize('token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1
    })
  });
  return {
    status: 200
  };
}
