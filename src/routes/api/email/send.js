import { promises as fs } from 'fs';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';

const getTemplate = async template => {
  const html = await fs.readFile('./src/emailTemplates/' + template, { encoding: 'utf-8' } );
  return html;
}

const handlebarsReplace = ( html, replacements ) => {
  const template = handlebars.compile(html);
  const replacedHtml = template(replacements);

  return replacedHtml;
}

export async function post({body}) {
  // set defaults
  const defaults = {
    from: '"No Reply" <abtl.noreply@gmail.com>',
    subject: 'TEST SUBJECT',
    to: 'bob_mcaleavey@ennis.com',
  };

  // merge defaults
  body = Object.assign(defaults, body);

  // destructure params
  const { from, subject, to } = body;

  // setup transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'abtl.noreply@gmail.com',
      pass: 'ABTL1234$',
    },
  });

  // setup mailOptions
  const mailOptions = {
    from,
    to,
    subject,
  };

  // check for additional parameters
  if ( 'cc' in body ) mailOptions.cc = body.cc;
  if ( 'html' in body ) mailOptions.html = body.html;
  if ( 'replyTo' in body ) mailOptions.replyTo = body.replyTo;
  if ( 'template' in body ) mailOptions.html = await getTemplate( body.template );
  if ( 'replacements' in body ) mailOptions.html = handlebarsReplace(mailOptions.html, body.replacements)

  const info = await transporter.sendMail(mailOptions);

  return {
    status: 200,
    body : {}
  }
}