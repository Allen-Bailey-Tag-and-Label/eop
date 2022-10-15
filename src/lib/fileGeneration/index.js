import download from 'downloadjs';
import pdf from './pdf';

const types = {
  pdf: {
    extension: 'pdf',
    mime: 'application/pdf'
  }
};

export default async ({ doc, template, type }) => {
  const bytes = type === 'pdf' ? await pdf({ doc, template }) : '';

  const d = new Date();
  const date = [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds()
  ]
    .map((n) => n.toString().padStart(2, '0'))
    .join('-');

  download(bytes, `${template}-${date}.${types[type].extension}`, types[type].mime);
};
