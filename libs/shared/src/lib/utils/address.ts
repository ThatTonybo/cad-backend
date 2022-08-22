export const validateAddress = async (address: string): Promise<boolean> => {
  const splitAddress = address.split(', ');
  if (splitAddress.length !== 2) return false;

  const splitAddressFurther = splitAddress[0].split(' ');
  if (splitAddressFurther.length < 3 || isNaN(Number(splitAddressFurther[0]))) return false;

  return true;
};
