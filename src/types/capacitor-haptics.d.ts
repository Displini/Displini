/**
 * Optional: @capacitor/haptics is used only in Capacitor builds.
 * Declare so TS compiles when the package is not installed.
 */
declare module "@capacitor/haptics" {
  export const Haptics: {
    impact(options?: { style: "LIGHT" | "MEDIUM" | "HEAVY" }): Promise<void>;
    notification(options?: {
      type: "SUCCESS" | "WARNING" | "ERROR";
    }): Promise<void>;
    selectionStart(): Promise<void>;
    selectionChanged(): Promise<void>;
    selectionEnd(): Promise<void>;
  };
}
