// Allows Unicode letters (including diacritics), digits, and spaces; minimum 3 chars enforced separately
export const USERNAME_REGEX = /^[\p{L}\p{N} ]+$/u;
