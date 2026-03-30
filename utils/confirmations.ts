export async function tripleConfirm(
  messages: [string, string, string],
): Promise<boolean> {
  for (const message of messages) {
    if (!window.confirm(message)) return false;
  }
  return true;
}
