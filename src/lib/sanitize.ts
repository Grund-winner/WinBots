// Input sanitization utilities

// Strip HTML tags from string
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

// Sanitize string for safe storage (trim + strip HTML)
export function sanitizeString(input: string): string {
  return stripHtml(input.trim());
}

// Sanitize username (alphanumeric + underscore, 3-20 chars)
export function sanitizeUsername(username: string): string | null {
  const cleaned = username.trim().toLowerCase();
  // Only allow letters, numbers, underscores, hyphens
  if (!/^[a-z0-9_-]{3,20}$/.test(cleaned)) return null;
  return cleaned;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

// Validate password strength (min 8 chars, must have letter + number)
export function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins 8 caracteres' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins une lettre' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  return { valid: true };
}

// Truncate string to max length
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}
