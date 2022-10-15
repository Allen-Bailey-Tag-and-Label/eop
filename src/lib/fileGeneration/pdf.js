import { PDFDocument } from 'pdf-lib';

export default async ({ doc, template }) => {
  const response = await fetch(`/forms/${template}.pdf`);
  const arrayBuffer = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  fields.forEach((field) => {
    const type = field.constructor.name;
    const name = field.getName();
    //   console.log({ type, name });
    if (type === 'PDFTextField2') {
      form.getTextField(name).setText(doc[name]);
      form.getTextField(name).enableReadOnly();
    }
    if (type === 'PDFRadioGroup2') {
      form.getRadioGroup(name).select(doc?.[name]?.toString());
      form.getRadioGroup(name).enableReadOnly();
    }
  });

  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
};
