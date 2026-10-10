/** Suppress benign MediaPipe/TFLite stderr logs that trigger Next.js dev overlay. */
export function installMediaPipeLogFilter(): () => void {
  const origError = console.error;
  const origWarn = console.warn;

  const shouldIgnore = (args: unknown[]) => {
    const text = args.map(String).join(" ");
    return (
      text.includes("TensorFlow Lite") ||
      text.includes("XNNPACK") ||
      text.includes("Created TensorFlow Lite") ||
      text.includes("INFO: Created TensorFlow")
    );
  };

  console.error = (...args: unknown[]) => {
    if (shouldIgnore(args)) return;
    origError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    if (shouldIgnore(args)) return;
    origWarn.apply(console, args);
  };

  return () => {
    console.error = origError;
    console.warn = origWarn;
  };
}
