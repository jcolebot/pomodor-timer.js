// Timer intervels.
const timer = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    sessions: 0
};

let interval;

const buttonSound = new Audio('./sounds/button-sound.mp3');
const mainButton = document.getElementById('js-btn');

mainButton.addEventListener('click', () => {
    buttonSound.play();
    // dataset property provides read/write access to custom data attributes.
    const { action } = mainButton.dataset;
    if(action === 'start') {
        startTimer();
    } else {
        stopTimer();
    }
});

// Handling button clicks to start/stop timer.
const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);

function getRemainingTime(endTime) {
    const currentTime = Date.parse(new Date());
    const difference = endTime - currentTime;

    const total = Number.parseInt(difference / 1000, 10);
    const minutes = Number.parseInt((total / 60) % 60, 10);
    const seconds = Number.parseInt(total % 60, 10);

    return {total, minutes, seconds};
}

function startTimer() {
    let { total } = timer.remainingTime;

    // Determine endtime by grabbing current timestamp and convert to seconds
    const endTime = Date.parse(new Date()) + total * 1000;

    if(timer.mode === 'pomodoro') timer.sessions++;

    // Change main button text to 'stop'.
    mainButton.dataset.action = 'stop';
    mainButton.textContent = 'stop';
    mainButton.classList.add('active');

    interval = setInterval(function() {
        timer.remainingTime = getRemainingTime(endTime);
        updateClock();

        total = timer.remainingTime.total;
        if(total <= 0) {
            clearInterval(interval);

            switch(timer.mode) {
                case 'pomodoro':
                    if(timer.sessions % timer.longBreakInterval === 0) {
                        switchMode('longBreak');
                    } else {
                        switchMode('shortBreak');
                    }
                    break;
                default:
                    switchMode('pomodoro');
            }

            if(Notification.permission === 'granted') {
                const text = timer.mode === 'pomodoro' ? 'Time to focus!' : 'Break time!';
                new Notification(text);
            }

            document.querySelector(`[data-sound="${timer.mode}"]`).play();

            startTimer();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(interval);
    
    // Switch main button text back to 'start'.
    mainButton.dataset.action = 'start';
    mainButton.textContent = 'start';
    mainButton.classList.remove('active');
}

function updateClock() {
    const { remainingTime } = timer;
    // Pad time with 0's to maintain two digit spacing.
    const minutes = `${remainingTime.minutes}`.padStart(2, '0');
    const seconds = `${remainingTime.seconds}`.padStart(2, '0');

    const min = document.getElementById('js-minutes');
    const sec = document.getElementById('js-seconds');
    min.textContent = minutes;
    sec.textContent = seconds;

    // Allow user to see time without switching tabs by changing title text.
    const text = timer.mode === 'pomodoro' ? 'Stay focused!' : 'Break time!';
    document.title = `${minutes}:${seconds} — ${text}`;

    // Update progress bar with time remaining.
    const progress = document.getElementById('js-progress');
    progress.value = timer[timer.mode] * 60 - timer.remainingTime.total;
}

function switchMode(mode) {
    timer.mode = mode;
    timer.remainingTime = {
        total: timer[mode] * 60, // Convert everything to seconds for simplicity.
        minutes: timer[mode],
        seconds: 0
    };
    document.querySelectorAll('button[data-mode]')
    .forEach(e => e.classList.remove('active'));

    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    document.body.style.backgroundColor = `var(--${mode})`;
    document.getElementById('js-progress').setAttribute('max', timer.remainingTime.total);

    updateClock();
}

function handleMode(event) {
    const { mode } = event.target.dataset; // Retrieve value from target element.

    if(!mode) return;

    switchMode(mode);

    stopTimer();
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if the browser supports notifications and ask user to opt in.
    if('Notification' in window) {
        if(Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(function(permission) {
                if(permission === 'granted') {
                    new Notification('You will be notified when the session starts.');
                }
            });
        }
    }
    switchMode('pomodoro');
});