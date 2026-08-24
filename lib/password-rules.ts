export interface PasswordRequirementChecks {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordRequirementCheck {
  valid: boolean;
  reason: string;
  checks: PasswordRequirementChecks;
}

export const MIN_PASSWORD_LENGTH = 10;

export function validatePasswordComplexity(password: string): PasswordRequirementCheck {
  const checks: PasswordRequirementChecks = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const entries: [keyof typeof checks, string, string][] = [
    ["minLength", "minimum 10 karakter", `legalább ${MIN_PASSWORD_LENGTH} karakteres`],
    ["hasUppercase", "nagybetű", "legalább egy nagybetű (A-Z)"],
    ["hasLowercase", "kisbetű", "legalább egy kisbetű (a-z)"],
    ["hasNumber", "számjegy", "legalább egy szám (0-9)"],
    ["hasSpecial", "speciális karakter", "legalább egy speciális karakter (pl. !@#$%^&*)"],
  ];

  const firstFailed = entries.find(([key]) => !checks[key]);
  if (firstFailed) {
    return {
      valid: false,
      reason: `A jelszónak ${firstFailed[2]} kell lennie.`,
      checks,
    };
  }

  return { valid: true, reason: "OK", checks };
}
