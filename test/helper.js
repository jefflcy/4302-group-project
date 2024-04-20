// Helper Functions returns Start and End Times of Project
// Start Time of Project can be before or after current time
// End Time of Project must be after current time

// Input number of hours prior to current time is the Project Start Time
function startTimePrior(hours) {
    const prior = hours * 3600;
    const currentTime = Math.floor((new Date().getTime()) / 1000);
    return currentTime - prior;
}

// Input number of hours after current time is the Project Start Time
function startTimeAfter(hours) {
    const after = hours * 3600;
    const currentTime = Math.floor((new Date().getTime()) / 1000);
    return currentTime + after;
}

// Input number of hours after current time is the Project End Time
function endTimeAfter(hours) {
    const after = hours * 3600;
    const currentTime = Math.floor((new Date().getTime()) / 1000);
    return currentTime + after;
}
module.exports = {
    startTimeAfter,
    startTimePrior,
    endTimeAfter
};