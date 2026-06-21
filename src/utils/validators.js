// Validators utility functions
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function validatePhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}
