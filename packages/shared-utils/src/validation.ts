const SA_PHONE_REGEX = /^(\+?966|0)?5\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CR_REGEX = /^\d{10}$/;
const VAT_REGEX = /^3\d{14}$/;

export function isSaudiPhone(phone: string): boolean {
  return SA_PHONE_REGEX.test(phone.replace(/\s/g, ''));
}

export function isEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isCRNumber(cr: string): boolean {
  return CR_REGEX.test(cr);
}

export function isVATNumber(vat: string): boolean {
  return VAT_REGEX.test(vat);
}

export function normalizeSaudiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) return `+${digits}`;
  if (digits.startsWith('05')) return `+966${digits.slice(1)}`;
  if (digits.startsWith('5')) return `+966${digits}`;
  return phone;
}

export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}
