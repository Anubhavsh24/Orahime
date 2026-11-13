/* ===================================================
   CHRONOS — script.js
   Real-Time Clock · Stopwatch · Alarm
   Pure vanilla JavaScript — no libraries
   =================================================== */

// ============================
// DOM Elements
// ============================

// Tab navigation
var tabButtons = document.querySelectorAll('.tab-btn');
var tabPanels  = document.querySelectorAll('.tab-panel');

// Clock elements
var clockHours   = document.getElementById('clock-hours');
var clockMinutes = document.getElementById('clock-minutes');
var clockSeconds = document.getElementById('clock-seconds');
var clockAmpm    = document.getElementById('clock-ampm');
var clockDate    = document.getElementById('clock-date');
var clockRing    = document.getElementById('clock-ring-progress');

// Stopwatch elements
var swHours   = document.getElementById('sw-hours');
var swMinutes = document.getElementById('sw-minutes');
var swSeconds = document.getElementById('sw-seconds');
var swStatus  = document.getElementById('sw-status');
var swStart   = document.getElementById('sw-start');
var swPause   = document.getElementById('sw-pause');
var swReset   = document.getElementById('sw-reset');

// Alarm elements
var alarmTimeInput   = document.getElementById('alarm-time');
var alarmSetBtn      = document.getElementById('alarm-set');
var alarmStopBtn     = document.getElementById('alarm-stop');
var alarmClearBtn    = document.getElementById('alarm-clear');
var alarmStatus      = document.getElementById('alarm-status');
var alarmActiveDisplay = document.getElementById('alarm-active-display');
var alarmActiveTime  = document.getElementById('alarm-active-time');
var alarmCard        = document.querySelector('.alarm-card');

// ============================
// Tab Switching
// ============================

/**
 * Switch between Clock, Stopwatch, and Alarm tabs.
 * Updates active states on buttons and panels.
 */
function switchTab(tabName) {
    // Update tab buttons
    for (var i = 0; i < tabButtons.length; i++) {
        var btn = tabButtons[i];
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        }
    }

    // Update tab panels
    for (var j = 0; j < tabPanels.length; j++) {
        var panel = tabPanels[j];
        if (panel.id === 'panel-' + tabName) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    }
}

// Attach click listeners to tab buttons
for (var t = 0; t < tabButtons.length; t++) {
    tabButtons[t].addEventListener('click', function () {
        var tabName = this.getAttribute('data-tab');
        switchTab(tabName);
    });
}


// ============================
// 1. Real-Time Clock
// ============================

var clockIntervalId = null;

/**
 * Pad a number to 2 digits (e.g. 5 → "05").
 */
function padZero(num) {
    if (num < 10) {
        return '0' + num;
    }
    return '' + num;
}

/**
 * Get the day-of-week name.
 */
function getDayName(dayIndex) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

/**
 * Get the month name.
 */
function getMonthName(monthIndex) {
    var months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
}

/**
 * Get ordinal suffix for a day (1st, 2nd, 3rd, 4th, etc.).
 */
function getOrdinal(day) {
    if (day >= 11 && day <= 13) {
        return day + 'th';
    }
    switch (day % 10) {
        case 1: return day + 'st';
        case 2: return day + 'nd';
        case 3: return day + 'rd';
        default: return day + 'th';
    }
}

/**
 * Update the clock display with the current local time.
 * Called once per second.
 */
function updateClock() {
    var now = new Date();

    var hours24 = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    // 12-hour format
    var ampm = hours24 >= 12 ? 'PM' : 'AM';
    var hours12 = hours24 % 12;
    if (hours12 === 0) {
        hours12 = 12;
    }

    // Update time digits
    clockHours.textContent   = padZero(hours12);
    clockMinutes.textContent = padZero(minutes);
    clockSeconds.textContent = padZero(seconds);
    clockAmpm.textContent    = ampm;

    // Update date
    var dayName   = getDayName(now.getDay());
    var monthName = getMonthName(now.getMonth());
    var dayNum    = getOrdinal(now.getDate());
    var year      = now.getFullYear();
    clockDate.textContent = dayName + ', ' + monthName + ' ' + dayNum + ', ' + year;

    // Update seconds ring progress
    var progress = seconds / 60;
    var circumference = 2 * Math.PI * 90; // radius = 90
    var offset = circumference * (1 - progress);
    clockRing.style.strokeDashoffset = offset;

    // Also check alarm every second
    checkAlarm(hours24, minutes, seconds);
}

// Start clock immediately and set interval
updateClock();
clockIntervalId = setInterval(updateClock, 1000);


// ============================
// 2. Stopwatch
// ============================

var swIntervalId = null;      // Interval ID for the stopwatch
var swElapsedSeconds = 0;     // Total elapsed seconds
var swIsRunning = false;      // Whether the stopwatch is currently running

/**
 * Update the stopwatch display based on the current elapsed seconds.
 */
function updateStopwatchDisplay() {
    var totalSeconds = swElapsedSeconds;

    var hours   = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    swHours.textContent   = padZero(hours);
    swMinutes.textContent = padZero(minutes);
    swSeconds.textContent = padZero(seconds);
}

/**
 * Increment the stopwatch by one second.
 * Called by the interval timer.
 */
function tickStopwatch() {
    swElapsedSeconds = swElapsedSeconds + 1;
    updateStopwatchDisplay();
}

/**
 * Start (or resume) the stopwatch.
 */
function startStopwatch() {
    if (swIsRunning) {
        return; // Prevent duplicate intervals
    }

    swIsRunning = true;
    swIntervalId = setInterval(tickStopwatch, 1000);

    // Update UI
    swStatus.textContent = 'Running';
    swStatus.className = 'stopwatch-status running';

    swStart.textContent = 'Start';
    swStart.disabled = true;
    swPause.disabled = false;
    swPause.textContent = 'Pause';
    swReset.disabled = false;
}

/**
 * Pause the stopwatch.
 * Clears the interval but keeps elapsed time.
 */
function pauseStopwatch() {
    if (!swIsRunning) {
        return;
    }

    swIsRunning = false;
    clearInterval(swIntervalId);
    swIntervalId = null;

    // Update UI
    swStatus.textContent = 'Paused';
    swStatus.className = 'stopwatch-status paused';

    swStart.disabled = false;
    swStart.textContent = 'Resume';
    swPause.disabled = true;
}

/**
 * Reset the stopwatch to zero.
 */
function resetStopwatch() {
    // Stop the interval if running
    swIsRunning = false;
    if (swIntervalId !== null) {
        clearInterval(swIntervalId);
        swIntervalId = null;
    }

    // Reset elapsed time
    swElapsedSeconds = 0;
    updateStopwatchDisplay();

    // Update UI
    swStatus.textContent = 'Ready';
    swStatus.className = 'stopwatch-status';

    swStart.textContent = 'Start';
    swStart.disabled = false;
    swPause.disabled = true;
    swPause.textContent = 'Pause';
    swReset.disabled = true;
}

// Attach event listeners
swStart.addEventListener('click', startStopwatch);
swPause.addEventListener('click', pauseStopwatch);
swReset.addEventListener('click', resetStopwatch);


// ============================
// 3. Alarm Clock
// ============================

var alarmHour = null;       // Alarm hour (24-hour format, 0–23)
var alarmMinute = null;     // Alarm minute (0–59)
var alarmIsSet = false;     // Whether an alarm is currently set
var alarmIsRinging = false; // Whether the alarm is currently ringing
var alarmAudioContext = null;
var alarmOscillator = null;
var alarmGainNode = null;

/**
 * Create an alarm sound using the Web Audio API.
 * Generates a pleasant two-tone beeping pattern.
 */
function startAlarmSound() {
    try {
        // Create audio context
        alarmAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        alarmGainNode = alarmAudioContext.createGain();
        alarmGainNode.connect(alarmAudioContext.destination);
        alarmGainNode.gain.value = 0.3;

        // Create oscillator for the beep
        alarmOscillator = alarmAudioContext.createOscillator();
        alarmOscillator.type = 'sine';
        alarmOscillator.frequency.value = 800;
        alarmOscillator.connect(alarmGainNode);
        alarmOscillator.start();

        // Create a beeping pattern by modulating the gain
        scheduleBeeps();
    } catch (error) {
        // Fallback: if Web Audio API isn't available, do nothing
        // The visual alarm indicator still works
    }
}

/**
 * Schedule repeating beep pattern.
 */
function scheduleBeeps() {
    if (!alarmAudioContext || !alarmGainNode || !alarmIsRinging) {
        return;
    }

    var currentTime = alarmAudioContext.currentTime;

    // Schedule 10 seconds of beeps (then re-schedule if still ringing)
    for (var i = 0; i < 20; i++) {
        var beepStart = currentTime + (i * 0.5);
        // Beep on
        alarmGainNode.gain.setValueAtTime(0.3, beepStart);
        // Beep off
        alarmGainNode.gain.setValueAtTime(0.0, beepStart + 0.2);

        // Alternate frequency for two-tone effect
        if (i % 2 === 0) {
            alarmOscillator.frequency.setValueAtTime(800, beepStart);
        } else {
            alarmOscillator.frequency.setValueAtTime(600, beepStart);
        }
    }

    // Re-schedule after the current batch finishes
    setTimeout(function () {
        if (alarmIsRinging) {
            scheduleBeeps();
        }
    }, 10000);
}

/**
 * Stop the alarm sound.
 */
function stopAlarmSound() {
    if (alarmOscillator) {
        try {
            alarmOscillator.stop();
        } catch (e) {
            // Already stopped
        }
        alarmOscillator = null;
    }

    if (alarmAudioContext) {
        try {
            alarmAudioContext.close();
        } catch (e) {
            // Already closed
        }
        alarmAudioContext = null;
    }

    alarmGainNode = null;
}

/**
 * Format alarm time for display (e.g., "07:30 AM").
 */
function formatAlarmTime(hour24, minute) {
    var ampm = hour24 >= 12 ? 'PM' : 'AM';
    var hour12 = hour24 % 12;
    if (hour12 === 0) {
        hour12 = 12;
    }
    return padZero(hour12) + ':' + padZero(minute) + ' ' + ampm;
}

/**
 * Set the alarm based on the time input value.
 */
function setAlarm() {
    var timeValue = alarmTimeInput.value;

    // Validate input
    if (!timeValue) {
        // Briefly highlight the input to indicate error
        alarmTimeInput.style.borderColor = '#ef4444';
        setTimeout(function () {
            alarmTimeInput.style.borderColor = '';
        }, 1500);
        return;
    }

    // Parse the time (format: "HH:MM")
    var parts = timeValue.split(':');
    alarmHour   = parseInt(parts[0], 10);
    alarmMinute = parseInt(parts[1], 10);
    alarmIsSet  = true;

    // Update display
    var formattedTime = formatAlarmTime(alarmHour, alarmMinute);
    alarmActiveTime.textContent = formattedTime;
    alarmActiveDisplay.classList.remove('hidden');

    alarmStatus.querySelector('.alarm-status-icon').textContent = '🔔';
    alarmStatus.querySelector('.alarm-status-text').textContent = 'Alarm set for ' + formattedTime;

    // Update buttons
    alarmSetBtn.disabled = true;
    alarmClearBtn.disabled = false;
    alarmTimeInput.disabled = true;
}

/**
 * Check if the current time matches the alarm time.
 * Called every second from the clock update function.
 */
function checkAlarm(currentHour, currentMinute, currentSecond) {
    if (!alarmIsSet || alarmIsRinging) {
        return;
    }

    if (currentHour === alarmHour && currentMinute === alarmMinute && currentSecond === 0) {
        triggerAlarm();
    }
}

/**
 * Trigger the alarm — play sound and show visual indicators.
 */
function triggerAlarm() {
    alarmIsRinging = true;

    // Visual effects
    alarmCard.classList.add('ringing');
    alarmStatus.querySelector('.alarm-status-icon').textContent = '🔊';
    alarmStatus.querySelector('.alarm-status-text').textContent = 'ALARM RINGING!';

    // Enable stop button
    alarmStopBtn.disabled = false;

    // Play alarm sound
    startAlarmSound();
}

/**
 * Stop the ringing alarm.
 */
function stopAlarm() {
    alarmIsRinging = false;

    // Stop sound
    stopAlarmSound();

    // Remove visual effects
    alarmCard.classList.remove('ringing');

    // Update status — alarm stays set (user can clear it separately)
    alarmStopBtn.disabled = true;

    if (alarmIsSet) {
        var formattedTime = formatAlarmTime(alarmHour, alarmMinute);
        alarmStatus.querySelector('.alarm-status-icon').textContent = '🔔';
        alarmStatus.querySelector('.alarm-status-text').textContent = 'Alarm set for ' + formattedTime;
    }
}

/**
 * Clear the alarm entirely.
 */
function clearAlarm() {
    // Stop ringing if active
    if (alarmIsRinging) {
        stopAlarm();
    }

    // Reset alarm state
    alarmIsSet = false;
    alarmHour = null;
    alarmMinute = null;

    // Update display
    alarmActiveDisplay.classList.add('hidden');
    alarmStatus.querySelector('.alarm-status-icon').textContent = '🔕';
    alarmStatus.querySelector('.alarm-status-text').textContent = 'No alarm set';

    // Update buttons
    alarmSetBtn.disabled = false;
    alarmStopBtn.disabled = true;
    alarmClearBtn.disabled = true;
    alarmTimeInput.disabled = false;
    alarmTimeInput.value = '';
}

// Attach event listeners
alarmSetBtn.addEventListener('click', setAlarm);
alarmStopBtn.addEventListener('click', stopAlarm);
alarmClearBtn.addEventListener('click', clearAlarm);
