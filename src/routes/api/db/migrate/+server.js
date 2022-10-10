import { json } from '@sveltejs/kit';
import db from '$db';

export async function POST() {
  const [pcrs, roles, upsQuotes, users] = await Promise.all([
    await db.find({ collection: 'pay-change-requests' }),
    await db.find({ collection: 'roles' }),
    await db.find({ collection: 'ups-quotes' }),
    await db.find({ collection: 'users' })
  ]);

  await Promise.all(
    pcrs.map(async (pcr) => {
      let $set = {};
      try {
        pcr.change.date = new Date(pcr.change.date);
        pcr.change.date = `${pcr.change.date.getFullYear()}-${(pcr.change.date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${pcr.change.date.getDate().toString().padStart(2, '0')}`;
        $set['change.date'] = pcr.change.date;
        pcr.previous.date = new Date(pcr.previous.date);
        pcr.previous.date = `${pcr.previous.date.getFullYear()}-${(pcr.previous.date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${pcr.previous.date.getDate().toString().padStart(2, '0')}`;
        $set['previous.date'] = pcr.previous.date;
      } catch (error) {
        console.log(error);
      }
      await db.update({
        collection: 'pay-change-requests',
        query: {
          _id: pcr._id
        },
        update: { $set }
      });
    })
    upsQuotes.map(async (upsQuote) => {
      let date = new Date(+upsQuote.date);
      date = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
        .getDate()
        .toString()
        .padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      await db.update({
        collection: 'ups-quotes',
        query: {
          _id: upsQuote._id
        },
        update: {
          $set: {
            date
          }
        }
      });
    }),
    users.map(async (user) => {
      let hireDate = new Date(+user.hireDate);
      hireDate = `${hireDate.getFullYear()}-${(hireDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${hireDate.getDate().toString().padStart(2, '0')}`;
      let userRoles = user.roles.map((name) => {
        const { _id } = roles.find((role) => role.name === name);
        return _id;
      });
      await db.update({
        collection: 'users',
        query: {
          _id: user._id
        },
        update: {
          $set: {
            hireDate,
            roles: userRoles
          },
          $unset: {
            password: ''
          }
        }
      });
    })
  );
  return json({});
}
