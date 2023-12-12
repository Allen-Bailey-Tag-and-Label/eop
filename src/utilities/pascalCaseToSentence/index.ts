export const pascalCaseToSentence = (string: string) => {
  // capitalize first leter
  const capitalizedString = string.charAt(0).toUpperCase() + string.slice(1);

  // sentence case
  const sentenceCase = capitalizedString.replace(/([A-Z])/g, ' $1');

  return sentenceCase;
};
