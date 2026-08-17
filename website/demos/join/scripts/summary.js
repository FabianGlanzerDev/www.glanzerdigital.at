const mobileSummaryMediaQuery = window.matchMedia(
    "(max-width: 1024px) and (hover: none) and (pointer: coarse)"
);
const mobileGreetingStorageKey = "joinShowMobileGreeting";


/**
 * Shows all values on the summary page.
 */
async function renderSummaryMetrics() {
    const tasks = await getSummaryTasks();
    const urgentTasks = tasks.filter((task) => task.priority === "urgent");

    setSummaryValue("summaryToDo", countTasksByColumn(tasks, "todo"));
    setSummaryValue("summaryDone", countTasksByColumn(tasks, "done"));
    setSummaryValue("summaryUrgent", urgentTasks.length);
    setSummaryValue("summaryUpcomingDeadline", getUpcomingDeadlineText(urgentTasks));
    setSummaryValue("summaryTasksInBoard", tasks.length);
    setSummaryValue("summaryTasksInProgress", countTasksByColumn(tasks, "inprogress"));
    setSummaryValue("summaryAwaitingFeedback", countTasksByColumn(tasks, "awaitfeedback"));
}


/**
 * Gets all tasks for the summary page.
 * @returns {Array} The tasks.
 */
async function getSummaryTasks() {
    try {
        return await getTasks();
    } catch (error) {
        return [];
    }
}


/**
 * Counts tasks in one column.
 * @param {Array} tasks - The tasks.
 * @param {string} column - The column name.
 * @returns {number} The task count.
 */
function countTasksByColumn(tasks, column) {
    return tasks.filter((task) => task.column === column).length;
}


/**
 * Gets the next deadline text.
 * @param {Array} tasks - The tasks.
 * @returns {string} The deadline text.
 */
function getUpcomingDeadlineText(tasks) {
    const upcomingDeadline = tasks
        .map((task) => task.dueDate)
        .filter(Boolean)
        .sort()[0];

    return upcomingDeadline ? formatSummaryDate(upcomingDeadline) : "No deadline";
}


/**
 * Formats a date for the summary page.
 * @param {string} dateString - The date string.
 * @returns {string} The formatted date.
 */
function formatSummaryDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    });
}


/**
 * Sets a value in a summary element.
 * @param {string} elementId - The element id.
 * @param {*} value - The value.
 */
function setSummaryValue(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = value;
}


/**
 * Gets the greeting for the current time of day.
 * @returns {string} The time based greeting.
 */
function getTimeBasedGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) return "Good morning";
    if (currentHour < 18) return "Good afternoon";
    return "Good evening";
}


/**
 * Shows the active user on the summary page.
 */
function renderActiveUser() {
    const greetingElement = document.querySelector(".summary-user h2");
    const activeUserElement = document.getElementById("activeUser");
    const activeUser = getActiveUser();

    if (!greetingElement || !activeUserElement || !activeUser) return;

    const isGuest = activeUser.id === guestUserId;
    const greeting = getTimeBasedGreeting();

    greetingElement.textContent = isGuest ? `${greeting}!` : `${greeting},`;
    activeUserElement.textContent = isGuest ? "" : activeUser.name;
    activeUserElement.style.color = "var(--text-user)";
}


/**
 * Gets the summary section.
 * @returns {Object} The summary section.
 */
function getSummarySection() {
    return document.querySelector(".summary-section");
}


/**
 * Hides the mobile greeting.
 * @param {Object} summarySection - The summary section.
 */
function hideMobileGreeting(summarySection) {
    summarySection.classList.remove("mobile-greeting-active");
    summarySection.classList.add("mobile-greeting-finished");
}


/**
 * Shows the mobile greeting.
 */
function showMobileGreeting() {
    const summarySection = getSummarySection();
    const shouldShowGreeting = sessionStorage.getItem(mobileGreetingStorageKey) === "true";

    sessionStorage.removeItem(mobileGreetingStorageKey);

    if (!summarySection || !mobileSummaryMediaQuery.matches || !shouldShowGreeting || prefersReducedMotion()) {
        return;
    }

    summarySection.classList.add("mobile-greeting-active");
    addMobileGreetingEndListener(summarySection);
}


/**
 * Checks whether the user prefers reduced motion.
 * @returns {boolean} True if animations should be reduced.
 */
function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}


/**
 * Finishes the greeting when its CSS animation ends.
 * @param {Object} summarySection - The summary section.
 */
function addMobileGreetingEndListener(summarySection) {
    const greeting = summarySection.querySelector(".summary-user");

    if (!greeting) return hideMobileGreeting(summarySection);

    greeting.addEventListener("animationend", () => hideMobileGreeting(summarySection), { once: true });
}


/**
 * Handles the mobile greeting on screen size change.
 * @param {Object} event - The media query event.
 */
function handleSummaryViewportChange(event) {
    const summarySection = getSummarySection();

    if (!summarySection) {
        return;
    }

    if (!event.matches) hideMobileGreeting(summarySection);
}


showMobileGreeting();
renderActiveUser();
renderSummaryMetrics();
mobileSummaryMediaQuery.addEventListener("change", handleSummaryViewportChange);
