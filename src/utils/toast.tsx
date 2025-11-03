import { toast } from "sonner";
/**
 * Generic toast function for consistency
 */
type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "destructive";

export const showToast = ({
  variant = "default",
  title,
  description,
}: {
  variant?: ToastVariant;
  title?: string;
  description?: string;
}) => {
  const mappedVariant = variant === "destructive" ? "error" : variant;

  if (title) {
    toast[mappedVariant === "default" ? "message" : mappedVariant](title, {
      description,
    });
  } else if (description) {
    toast[mappedVariant === "default" ? "message" : mappedVariant](description);
  }
};