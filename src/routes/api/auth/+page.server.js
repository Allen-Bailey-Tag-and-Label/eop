import 'dotenv/config';

export const actions = {
  signout: async ({ cookies }) => {
    cookies.set('token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1
    });
    return {
      status: 200
    };
  }
};
