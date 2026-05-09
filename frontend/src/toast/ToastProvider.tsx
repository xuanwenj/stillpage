import { Toaster } from "react-hot-toast";

export const ToastProvider = () => (
  <Toaster
    position="top-center"
    gutter={8}
    toastOptions={{
      duration: 3500,
      style: {
        background: "#FFFFFF",
        color: "#1E1B2E",
        border: "1px solid #E2DDF0",
        borderRadius: "0.625rem",
        boxShadow: "0 8px 24px rgba(76, 61, 143, 0.12)",
        fontSize: "0.875rem",
        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        padding: "0.75rem 1rem",
        maxWidth: "360px",
      },
      success: {
        iconTheme: {
          primary: "#4C3D8F",
          secondary: "#FFFFFF",
        },
      },
      error: {
        duration: 4500,
        iconTheme: {
          primary: "#dc2626",
          secondary: "#FFFFFF",
        },
      },
    }}
  />
);
