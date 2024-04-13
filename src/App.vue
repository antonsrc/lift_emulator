<script setup>
import { ref, reactive, computed } from 'vue'
import json from './settings.json'

const [floorCount, shaftCount] = importSettings(json);
const LOC_STOR = window.localStorage;

let floors = [];
for (let i = 0; i < floorCount; i++) {
    floors.push(i)
}
floors.reverse()

let shafts = [];
for (let i = 0; i < shaftCount; i++) {
    shafts.push(i);
}

let liftRef = ref([]);
let queueOfCalls = reactive(new Set());
let objLift = {};
if (LOC_STOR.length == 0 || LOC_STOR.getItem('lifts') == 'null') {
    for (let i = 0; i < shaftCount; i++) {
        objLift[i] = {
            atWork: false,
            direction: 0,
            nowFloor: 0,
            nowFloorRender: floorCount,
            targetFloor: 0,
        };
    }
} else {
    objLift = JSON.parse(LOC_STOR.getItem('lifts'));
    for (let lift in objLift) {
        objLift[lift].atWork = false;
    }
}

let lifts = reactive(objLift);

window.addEventListener('unload', function () {
    LOC_STOR.setItem('lifts', JSON.stringify(lifts));
})

function importSettings(json) {
    const projSettings = reactive(json);
    return [+projSettings.floorCount, +projSettings.shaftCount];
}

function initial() {
    for (let i = 0; i < shaftCount; i++) {
        lifts[i] = {
            atWork: false,
            direction: 0,
            nowFloor: 0,
            nowFloorRender: floorCount,
            targetFloor: 0,
        };
    }
}

function callLift(e) {
    let btnFloor = +e.target.id.split('_')[1];
    if (!queueOfCalls.has(btnFloor)) {
        e.target.style.backgroundColor = 'red';
        queueOfCalls.add(btnFloor);
    }

    let nearestLift = getNearestFreeLift(btnFloor);
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
    lifts[lift].direction = getDirection(lifts[lift].nowFloor, targetFloor);
    let counts = Math.abs(lifts[lift].nowFloor - targetFloor);
    lifts[lift].targetFloor = targetFloor;

    for (let i = counts; i > 0; i--) {
        await delay(1000);
        lifts[lift].nowFloor = lifts[lift].nowFloor + lifts[lift].direction;
        lifts[lift].nowFloorRender = floorCount - lifts[lift].nowFloor;
    }

    await stopWaiting(targetFloor, lift);
    lifts[lift].atWork = false;
    if (queueOfCalls.size > 0) {
        let nearestLift = getNearestFreeLift(targetFloor);
        if (lifts[nearestLift].atWork == false) {
            moveLift(nearestLift);
        }
    }
}

function getNearestFreeLift(button) {
    let diff = floorCount;
    let nearest = -1;
    for (const lift in lifts) {
        if (lifts[lift]['atWork']) {
            continue;
        }
        else if (diff > Math.abs(lifts[lift].nowFloor - button)) {
            nearest = lift;
            diff = Math.abs(lifts[lift].nowFloor - button);
        }
    }
    return nearest;
}

async function stopWaiting(q, lift) {
    lifts[lift].direction = 0;
    document.getElementById(`btn_${q}`).style.backgroundColor = 'bisque';
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
                <span :id="'btn_' + floor" className="btn" @click="callLift">Вызвать</span>
            </div>
        </div>
        <div className="liftShaft" v-for="shaft in shafts">
            <div className="liftExits" v-for="floor in floors">
                <span>{{ floor + 1 }}</span>
            </div>
            <div ref="liftRef" className="lift"
                :style="{ gridRowStart: lifts[shaft].nowFloorRender, gridRowEnd: lifts[shaft].nowFloorRender }">
                <span v-if="lifts[shaft].direction == 1">Вверх ↑ на {{ lifts[shaft].targetFloor + 1 }} этаж</span>
                <span v-else-if="lifts[shaft].direction == -1">Вниз ↓ на {{ lifts[shaft].targetFloor + 1 }} этаж</span>
                <span v-else></span>
            </div>
        </div>

    </div>
    <div :style="{ marginTop: '15px' }">
        <span id="btnInitial" @click="initial">Сбросить на начальные позиции</span>
    </div>
</template>

<style scoped>
.commonArea {
    display: flex;
    gap: 3px;
    flex-direction: row;
    font-family: Arial, Helvetica, sans-serif;
}

#btnInitial {
    cursor: pointer;
    background-color: bisque;
    padding: 7px;
    border-radius: 5px;
    font-size: 1rem;
    font-family: Arial, Helvetica, sans-serif;
}

#btnInitial:hover {
    background-color: rgba(0, 198, 83, 0.508);
}

.floor {
    border: solid 1px rgb(255, 241, 223);
    width: 100%;
    height: 60px;
    justify-content: center;
    align-items: center;
    display: flex;
    flex-direction: column;
}

.callButtons {
    display: grid;
    grid-template-rows: repeat(v-bind('floorCount'), 60px);
    grid-gap: 3px;
}

.liftShaft {
    display: grid;
    grid-template-rows: repeat(v-bind('floorCount'), 60px);
    grid-gap: 3px;
    width: 20%;
    position: relative;
}

.liftExits {
    border: solid 1px rgba(0, 198, 83, 0.508);
    height: 60px;
    font-size: 1.5rem;
    align-items: center;
    display: flex;
    padding-left: 10px;
}

.lift {
    background-color: rgba(0, 198, 83, 0.508);
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
    padding: 5px;
    border-radius: 5px;
}

.initBtn {
    margin: 3px;
    font-size: 1rem;
    font-family: Arial, Helvetica, sans-serif;
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

@media screen {
    .commonArea {
        font-size: 1rem;
    }

}

@media screen and (max-width: 600px) {
    .commonArea {
        font-size: 0.8rem;
    }
}
</style>
