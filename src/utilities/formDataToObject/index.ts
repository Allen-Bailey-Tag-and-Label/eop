export const formDataToObject = (formData: FormData) => {
  // initiate object
  const object: any = {};

  // loop over form data
  formData.forEach((value, key) => {
    object[key] = value.toString();
  });

  return object;
};
