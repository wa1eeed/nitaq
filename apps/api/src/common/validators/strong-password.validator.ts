import {
  registerDecorator, ValidationArguments, ValidationOptions,
} from 'class-validator';

const RULES = {
  minLength: 8,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  digit: /\d/,
  symbol: /[^A-Za-z0-9]/,
};

export function describePasswordViolations(value: string): string[] {
  const issues: string[] = [];
  if (value.length < RULES.minLength) issues.push(`8 أحرف على الأقل`);
  if (!RULES.upper.test(value)) issues.push('حرف كبير واحد على الأقل (A–Z)');
  if (!RULES.lower.test(value)) issues.push('حرف صغير واحد على الأقل (a–z)');
  if (!RULES.digit.test(value)) issues.push('رقم واحد على الأقل (0–9)');
  if (!RULES.symbol.test(value)) issues.push('رمز خاص واحد على الأقل (!@#…)');
  return issues;
}

/**
 * Strong password requirements:
 *   - ≥ 8 chars
 *   - at least one uppercase letter
 *   - at least one lowercase letter
 *   - at least one digit
 *   - at least one symbol (non-alphanumeric)
 *
 * Returns Arabic error messages listing exactly what's missing.
 */
export function IsStrongPassword(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return describePasswordViolations(value).length === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value as string;
          if (typeof value !== 'string') return 'كلمة المرور مطلوبة';
          const violations = describePasswordViolations(value);
          return `كلمة المرور ضعيفة — يجب أن تحتوي على: ${violations.join('، ')}`;
        },
      },
    });
  };
}
