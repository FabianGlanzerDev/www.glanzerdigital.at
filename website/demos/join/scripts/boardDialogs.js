/** Runs a close callback when the backdrop itself was selected. */
function closeBoardDialogOnBackdrop(event, closeCallback) {
    if (event.target === event.currentTarget) closeCallback();
}


/** Runs a close callback when Escape was pressed. */
function closeBoardDialogOnEscape(event, closeCallback) {
    if (event.key === "Escape") closeCallback();
}


/** Removes one board dialog from the document. */
function removeBoardDialog(dialogId) {
    document.getElementById(dialogId)?.remove();
}
