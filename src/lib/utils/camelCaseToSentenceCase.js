export default camelCase => {
  // add spaces between uppercase characters
  const camelCaseWithSpaces = camelCase.replace(/([A-Z])/g, " $1");

  // return sentence case
  return camelCaseWithSpaces.charAt(0).toUpperCase() + camelCaseWithSpaces.slice(1);
}