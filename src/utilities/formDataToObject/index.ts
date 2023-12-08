export const formDataToObject = (formData: FormData) => {
  // initiate object
  const object: { [key: string]: string } = {};

  // loop over form data
  formData.forEach((value, key) => {
    object[key] = value.toString();
  });

  return object;
};
