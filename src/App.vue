<script setup>
import { ref, reactive } from 'vue'

const LOC_STOR = window.localStorage;
const projSettings = {
    shaftCount: 3,
    floorCount: 10,
};

let floors = [];
for (let i = 0; i < projSettings.floorCount; i++) {
    floors.push(i)
}
floors.reverse()

let shafts = [];
for (let i = 0; i < projSettings.shaftCount; i++) {
    shafts.push(i);
}

let liftRef = ref([]);
let queueOfCalls = reactive(new Set());

let objLift = {};
if (LOC_STOR.length == 0) {
    for (let i = 0; i < projSettings.shaftCount; i++) {
        objLift[i] = {
            floor: 0,
            renderFloor: projSettings.floorCount,
            atWork: false,
            nextFloor: 0,
            direction: 0,
        };
    }
} else {
    objLift = JSON.parse(LOC_STOR.getItem('lifts'));
    for (let lift in objLift) {
        objLift[lift].atWork = false;
    }
    // let queue = JSON.parse(LOC_STOR.getItem('queueOfCalls'));
    // queue.forEach(item => {
    //     let objCall = {
    //         floor: item[0],
    //         event: item[1],
    //     };
    //     set.add(objCall);
    // });
}
let lifts = reactive(objLift);

window.addEventListener('unload', function () {
    LOC_STOR.setItem('lifts', JSON.stringify(lifts));
    // LOC_STOR.setItem('queueOfCalls', JSON.stringify(Array.from(queueOfCalls)));
})

function callLift(e, floorBtn) {
    let objCall = {
        floor: floorBtn,
        event: e,
    };
    if (!queueOfCalls.has(objCall)) {
        e.target.style.backgroundColor = 'red';
        queueOfCalls.add(objCall);
    }

    let nearestLift = getNearestFreeLift(floorBtn);
    if (nearestLift == -1) return; 
    if (lifts[nearestLift].atWork == false) {
        moveLift(nearestLift);
    } else {
        return;
    }
}

async function moveLift(lift) {
    lifts[lift].atWork = true;
    let [targetFloor] = queueOfCalls;
    queueOfCalls.delete(targetFloor);
    lifts[lift].direction = getDirection(lifts[lift].floor, targetFloor.floor);
    let counts = Math.abs(lifts[lift].floor - targetFloor.floor);
    lifts[lift].nextFloor = targetFloor.floor;

    for (let i = counts; i > 0; i--) {
        await delay(1000);
        lifts[lift].floor = lifts[lift].floor + lifts[lift].direction;
        lifts[lift].renderFloor = projSettings.floorCount - lifts[lift].floor;
    }
    
    await stopWaiting(targetFloor, lift);
    lifts[lift].atWork = false;
    if (queueOfCalls.size > 0) {
        let [nextTargetFloor] = queueOfCalls;
        let nearestLift = getNearestFreeLift(nextTargetFloor.floor);
        if (lifts[nearestLift].atWork == false) {
            moveLift(nearestLift);
        }
    }
}

function getNearestFreeLift(button) {
    let diff = projSettings.floorCount;
    let nearest = -1;
    for (const lift in lifts) {
        if (lifts[lift]['atWork']) {
            continue;
        }
        else if (diff > Math.abs(lifts[lift].floor - button)) {
            nearest = lift;
            diff = Math.abs(lifts[lift].floor - button);
        }
    }
    return nearest;
}

async function stopWaiting(q, lift) {
    lifts[lift].direction = 0;
    q.event.target.style.backgroundColor = 'bisque';
    liftRef.value[lift].className = 'liftBlink';
    await delay(3000);
    liftRef.value[lift].className = 'lift';
}

function delay(ms) {
    return new Promise((resolve, reject) => setTimeout(() => resolve(ms), ms));
}

function getDirection(from, to) {
    let dir = null;
    if (from < to) {
        dir = 1;
    } else {
        dir = -1;
    }
    return dir;
}
</script>

<template>
    <div className="commonArea">
        <div className="callButtons">
            <div className="floor" v-for="floor in floors">
                <span>Этаж {{ floor + 1 }}</span>
                <span :id="floor + '_btn'" className="btn" @click="callLift($event, floor)">Вызвать</span>
            </div>
        </div>

        <div className="liftShaft" v-for="shaft in shafts">
            <div className="liftExits" v-for="floor in floors">
                <span :style="{ fontSize: 2 + 'rem' }">{{ floor + 1 }}</span>
            </div>
            <div ref="liftRef" className="lift"
                :style="{ gridRowStart: lifts[shaft].renderFloor, gridRowEnd: lifts[shaft].renderFloor }">
                <span v-if="lifts[shaft].direction == 1">Вверх ↑ на {{ lifts[shaft].nextFloor + 1 }} этаж</span>
                <span v-else-if="lifts[shaft].direction == -1">Вниз ↓ на {{ lifts[shaft].nextFloor + 1 }} этаж</span>
                <span v-else></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.commonArea {
    display: flex;
    flex-direction: row;
    /* border: solid 2px rgb(255, 255, 255); */
}

.floor {
    border: solid 3px rgb(255, 255, 255);
    height: 40px;
}

.callButtons {
    display: flex;
    flex-direction: column;
    width: 10%;
    border: solid 4px rgb(255, 255, 255);
    justify-content: center;
    align-items: center;
}

.liftShaft {
    display: grid;
    grid-template-rows: repeat(v-bind('projSettings.floorCount'), 46px);
    width: 15%;
    border: solid 4px rgb(255, 255, 255);
    position: relative;
}

.liftExits {
    border: solid 3px rgb(101, 126, 216);
    height: 43px;
}

.lift {
    background-color: rgba(49, 235, 127, 0.508);
    width: 100%;
    height: 100%;
    position: absolute;

    display: flex;
    justify-content: center;
    align-items: center;
}

.liftBlink {
    width: 100%;
    height: 100%;
    position: absolute;

    animation-name: blink;
    animation-duration: 1.5s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;

    display: flex;
    justify-content: center;
    align-items: center;
}

.btn {
    cursor: pointer;
    background-color: bisque;
    margin: 5px;
}

@keyframes blink {
    from {
        background: rgba(255, 255, 255, 0);
        color: rgba(0, 0, 0, 0);
    }

    50% {
        background: rgba(0, 187, 78, 0.74);
        color: rgb(255, 255, 255);
    }

    to {
        background: rgba(255, 255, 255, 0);
        color: rgba(0, 0, 0, 0);
    }
}
</style>
