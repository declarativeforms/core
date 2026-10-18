export async function copyTextToClipboard(text: string): Promise<boolean> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      navigator.clipboard.writeText(text).then(() => true),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => resolve(false), 1500);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
