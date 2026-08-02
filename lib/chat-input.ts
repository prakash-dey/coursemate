export function isSendShortcut(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey">) {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}
