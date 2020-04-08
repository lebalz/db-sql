export function isSafePassword(password: string) {
  return password.length > 7 && password.length < 73;
}
