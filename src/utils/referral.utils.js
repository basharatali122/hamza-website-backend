export const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const calculateLevel = (referralCount) => {
  if (referralCount >= 20) return 3;
  if (referralCount >= 5) return 2;
  return 1;
};
