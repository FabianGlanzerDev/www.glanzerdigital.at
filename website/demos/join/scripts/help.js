const allowedPreviousPages = [
    "summary.html",
    "addTask.html",
    "board.html",
    "contacts.html"
];


/**
 * Gets the previous allowed page from the browser referrer.
 * @returns {string} The previous page filename.
 */
function getPreviousPage() {
    const previousPage = document.referrer.split("/").pop();

    if (allowedPreviousPages.includes(previousPage)) {
        return previousPage;
    }

    return "../index.html";
}


/**
 * Sets the matching previous page link as active in the sidebar.
 */
function setPreviousPageActive() {
    const previousPage = getPreviousPage();
    const sidebarLinks = document.querySelectorAll(".menu a");

    sidebarLinks.forEach(link => {
        if (link.getAttribute("href").includes(previousPage)) {
            link.classList.add("active");
        }
    });
}


/**
 * Navigates back to the previous allowed page.
 */
function goBackToPreviousPage() {
    const previousPage = getPreviousPage();

    window.location.href = `./${previousPage}`;
}


document.getElementById("backToPreviousPage").addEventListener("click", goBackToPreviousPage);
setPreviousPageActive();
