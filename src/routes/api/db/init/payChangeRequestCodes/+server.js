import { MongoClient } from 'mongodb';
import { ADMIN_PASSWORD, DATABASE_URL } from '$env/static/private';
import { prisma } from '$lib/prisma';

const codes = {
  '': '',
  '001': 'New Hire',
  '002': 'Rehire',
  '004': 'Department Change',
  '005': 'Shift Change',
  '006': 'Merit',
  '007': 'Range Adjustment',
  '008': 'Payroll Adjustment',
  '009': 'Annual Raise',
  '010': 'Database correction',
  '097': 'Reactivated to pay',
  '098': 'Automated Conversion-Old Sys.',
  '099': '**New Hire - Incomplete Setup',
  101: 'Military',
  102: 'Maternity',
  103: 'Long Term Disability',
  104: 'Other',
  105: 'Unpaid - Sick',
  106: 'Short Term Disability',
  107: 'Education',
  108: 'Jury Duty',
  201: 'Care of Newborn (paid)',
  202: 'Care of Newborn (unpd)',
  203: 'Care Adopt/Foster Child (paid)',
  204: 'Care Adopt/Foster Child (unpd)',
  205: 'Care of Family Members (paid)',
  206: 'Care of Family Members (unpd)',
  207: "Employee's Own Health (paid)",
  208: "Employee's Own Health (unpd)",
  301: 'Broadened Responsibility',
  302: 'Re-Classification',
  303: 'Demotion',
  304: 'New Responsibilities',
  305: 'Promotion',
  306: 'Reorganization',
  307: 'Transfer',
  308: 'Review',
  309: '6 Month/Review',
  310: 'Annual Review',
  311: 'Start Union Deduction',
  312: 'Stop Union Deduction',
  AA: 'Better Position',
  AC: 'Own Business',
  BC: 'Business Closed',
  DA: 'Career Opportunities',
  DB: 'Co-Workers',
  DC: 'Fringe Benefits',
  DD: 'Salary',
  DE: 'Supervisor',
  DF: 'Work Hours',
  DG: 'Job',
  DH: 'Death',
  DS: 'Permanent Disability',
  FR: 'Furlough',
  LDR: 'Disability Retirement',
  LL: 'Reached Limit of Job (LOA)',
  LO: 'Layoff',
  OA: 'Failed to Report for Work',
  OB: 'Medical Leave Exhausted',
  OC: 'Declined Offer of Alternate Wk',
  OD: 'Walked off Job',
  OE: 'Failed to Return',
  PA: 'Attend School',
  PB: 'Dependent Care Problem',
  PC: 'Leaving Area',
  PD: 'Marriage',
  PE: 'Medical',
  PF: 'Pregnancy',
  PG: 'School Hours Conflict',
  PH: 'Staying At Home',
  PI: 'Transportation Problems',
  PJ: 'Personal Matters',
  RE: 'Early Retirement',
  RL: 'Late Retirement',
  RN: 'Normal Retirement',
  RS: 'Resignation',
  RT: 'Retirement',
  TA: 'Absenteeism/Tardiness',
  TB: 'Destruction of Co. Property',
  TC: 'Falsification',
  TD: 'Inability to Perform Job',
  TE: 'Insubordination',
  TF: 'Misconduct',
  TG: 'Unauth Removal Co. Property',
  TH: 'Unauth Use/Misuse Co Property',
  TI: 'Violation of Company Rules',
  TJ: 'Violation of Safety Rules',
  TK: 'Failure to perform duties',
  WA: 'Assignment Completed',
  WB: 'Job Eliminated',
  WC: 'Lay off',
  WD: 'Seasonal Employment',
  WE: 'Lay off Limit',
  WF: 'Personnel Reduction',
  XD: 'Deceased',
  ZZZ: 'Correct Terms at Conversion'
};

export const GET = async ({ url: { searchParams } }) => {
  // get auth password
  const adminPassword = searchParams.get('adminPassword');

  // check if password doesn't match
  if (adminPassword !== ADMIN_PASSWORD)
    return new Response('Invalid adminPassword passed', { status: 401 });

  try {
    // initiate mongodb client
    const client = new MongoClient(DATABASE_URL.replace('v2', 'production'));

    // connect to mongodb client
    await client.connect();
    try {
      // delete all users in current db
      await prisma.payChangeRequestCode.deleteMany();

      // add users to current db
      await Promise.all(
        Object.keys(codes).map(async (code) => {
          const description = codes[code];
          try {
            await prisma.payChangeRequestCode.create({
              data: {
                code,
                description
              }
            });
          } catch (error) {
            console.log({ code, error });
          }
        })
      );
    } catch (error) {
      console.log(error);
    }
    client.close();
    return new Response();
  } catch (error) {
    console.log(error);
    return new Response(null, { status: 402 });
  }
};
