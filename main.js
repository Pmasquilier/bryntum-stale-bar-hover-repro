import { SchedulerPro } from '@bryntum/schedulerpro';

const logElement = document.getElementById('log');
const log = message => {
    logElement.textContent = `${new Date().toLocaleTimeString()}  ${message}\n` + logElement.textContent;
};

// The TypeError is thrown inside a DOM listener and reaches no Bryntum listener, so it is caught at the window
window.addEventListener('error', ({ message }) => log(`UNCAUGHT  ${message}`));
window.addEventListener('unhandledrejection', ({ reason }) => log(`UNHANDLED  ${reason?.message ?? reason}`));

// The redraw has to take longer than one frame for the inconsistent state to be observable, and that only happens
// once the stores hold a realistic amount of data. At 60 resources it is over within a frame and nothing throws.
const RESOURCE_COUNT = 800;
const EVENTS_PER_RESOURCE = 6;

const buildData = count => {
    const resources = [];
    const events = [];
    for (let id = 1; id <= count; id++) {
        resources.push({ id, name : `Employee ${id}` });
        for (let k = 0; k < EVENTS_PER_RESOURCE; k++) {
            events.push({
                id         : `${id}-${k}`,
                resourceId : id,
                name       : `Leave ${id}.${k}`,
                startDate  : new Date(2026, 0, 2 + k * 3),
                endDate    : new Date(2026, 0, 4 + k * 3)
            });
        }
    }
    return { resources, events };
};

const scheduler = new SchedulerPro({
    appendTo   : 'container',
    startDate  : new Date(2026, 0, 1),
    endDate    : new Date(2026, 0, 31),
    viewPreset : 'weekAndDayLetter',
    rowHeight  : 40,
    barMargin  : 4,

    columns : [{ text : 'Employee', field : 'name', width : 160 }],

    project : buildData(RESOURCE_COUNT)
});

// Stands in for a filter being applied: the server answers with fewer rows and both stores are replaced.
const setData = count => {
    const { resources, events } = buildData(count);
    scheduler.resourceStore.data = resources;
    scheduler.eventStore.data = events;
    log(`store replaced  ${resources.length} resources  ${events.length} events`);
};

// The inconsistent state only lasts about 300ms, which is hard to land a pointer move in on the first try.
// Swapping back and forth for a while turns it into something a resting hand runs into on its own.
const CYCLE_MS = 900;
const CYCLE_COUNT = 12;
let cycleTimer = null;

const stopCycle = () => {
    clearInterval(cycleTimer);
    cycleTimer = null;
};

const startCycle = () => {
    stopCycle();
    let step = 0;
    setData(1);
    cycleTimer = setInterval(() => {
        step++;
        setData(step % 2 === 0 ? 1 : RESOURCE_COUNT);
        if (step >= CYCLE_COUNT) {
            stopCycle();
            log('cycle finished — press N to run it again');
        }
    }, CYCLE_MS);
};

document.addEventListener('keydown', ({ key }) => {
    if (key === 'n' || key === 'N') {
        startCycle();
    }
    if (key === 'r' || key === 'R') {
        stopCycle();
        setData(RESOURCE_COUNT);
    }
});

window.scheduler = scheduler;
window.setData = setData;
log(`ready  ${scheduler.resourceStore.count} resources  ${scheduler.eventStore.count} events`);
