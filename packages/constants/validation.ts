// Allows Unicode letters (including diacritics), digits, and spaces; minimum 3 chars enforced separately
export const USERNAME_REGEX = /^[\p{L}\p{N} ]+$/u;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
