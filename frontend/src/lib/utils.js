export function pasteAsPlainText(event) {
  event.preventDefault();
  document.execCommand(
    "insertHTML",
    false,
    event.clipboardData.getData("text/plain")
  );
}

export function insertLineBreak() {
  // We need to remove double line breaks because Chrome inserts <div>'s
  // with <br>'s when breaking lines. Unfortunately this prevents the
  // browser to automatically scroll to the cursor position when inserting
  // line breaks.
  event.preventDefault();
  document.execCommand("insertLineBreak");
}
