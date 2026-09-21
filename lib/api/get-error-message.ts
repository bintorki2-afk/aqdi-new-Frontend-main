export function getErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Something went wrong";
  }

  // Surface Laravel validation errors ({ errors: { field: ["msg", ...] } }) so
  // the user sees the actual reason instead of a generic "invalid data" message.
  const errors = (data as { errors?: unknown }).errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const messages = Object.values(errors as Record<string, unknown>)
      .flatMap((value) =>
        Array.isArray(value)
          ? value.filter((item): item is string => typeof item === "string")
          : typeof value === "string"
            ? [value]
            : [],
      )
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  const message = (data as { message?: unknown }).message;

  if (typeof message === "string" && message.trim() !== "") {
    return message;
  }

  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(", ");
  }

  return "Something went wrong";
}
