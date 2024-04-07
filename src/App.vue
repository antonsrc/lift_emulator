<script setup>
import { computed, ref, onMounted, reactive } from 'vue'

const projSettings = {
    shaftCount: 2,
    floorCount: 7,
};

let floors = [];
for (let i = projSettings.floorCount; i > 0; i--) {
    floors.push(i)
}

let shaftsArr = [];
let objLift = {};
for (let i = 0; i < projSettings.shaftCount; i++) {
    shaftsArr.push(i);
    objLift[i] = {
        floor: 1,
        realFloor: projSettings.floorCount,
        atWork: false,
        nextFloor: 0,
    };
}
let queueOfLifts = reactive(objLift);

let liftRef = ref([]);
let shafts = ref(shaftsArr);

let queueOfCalls = reactive(new Set());

let direction = ref(null);


function getNearestFreeLift(button) {
    let diff = projSettings.floorCount;
    let nearest = -1;
    for (const lift in queueOfLifts) {
        if (queueOfLifts[lift]['atWork']) continue;
        else if (diff > Math.abs(queueOfLifts[lift].floor - button)) {
            nearest = queueOfLifts[lift].floor;
            diff = Math.abs(queueOfLifts[lift].floor - button);
        }
    }
    return nearest;
}


async function stopWaiting(queue, q) {
    direction.value = 0;
    queue.delete(q);
    q.event.target.style.backgroundColor = 'bisque';
    liftRef.value[1].className = 'liftBlink';
    await delay(3000);
    liftRef.value[1].className = 'lift';
}

async function moveLift(queue, lift) {
    queueOfLifts[lift].atWork = true;
    for (let q of queue) {
        direction.value = getDirection(queueOfLifts[lift].floor, q.floor);
        let counts = Math.abs(queueOfLifts[lift].floor - q.floor);
        queueOfLifts[lift].nextFloor = q.floor;

        for (let i = counts; i > 0; i--) {
            await delay(1000);
            queueOfLifts[lift].floor = queueOfLifts[lift].floor + direction.value;
            queueOfLifts[lift].realFloor = projSettings.floorCount +1 - queueOfLifts[lift].floor;
        }
        await stopWaiting(queue, q);
    }
    queueOfLifts[lift].atWork = false;
}



function callLift(e, floorBtn) {
    let objCall = {
        floor: floorBtn,
        event: e,
    };
    if (!queueOfCalls.has(objCall)) {
        e.target.style.backgroundColor = 'red';
        queueOfCalls.add(objCall);
        let nearestLift = getNearestFreeLift(floorBtn);
        if (queueOfLifts[nearestLift].atWork == false) {
            moveLift(queueOfCalls, nearestLift);
        }
    }
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
            <div className="floor" v-for="floor in projSettings.floorCount">
                <span>Этаж {{ floor }}</span>
                <span :id="floor + '_btn'" className="btn" @click="callLift($event, floor)">Вызвать</span>
            </div>
        </div>
        
        <div className="liftShaft" v-for="shaft in shafts">
            <div className="liftExits" v-for="floor in floors">
                <span :style="{ fontSize: 2 + 'rem' }">{{ floor }}</span>
            </div>
            <div ref="liftRef" className="lift" :style="{gridRowStart: queueOfLifts[shaft].realFloor, gridRowEnd: queueOfLifts[shaft].realFloor}">
                <span v-if="direction == 1">Вверх ↑ на {{ queueOfLifts[shaft].nextFloor }} этаж</span>
                <span v-else-if="direction == -1">Вниз ↓ на {{ queueOfLifts[shaft].nextFloor }} этаж</span>
                <span v-else></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.commonArea {
    display: flex;
    flex-direction: row;
    border: solid 2px rgb(221, 76, 247);
}

.floor {
    border: solid 3px rgb(222, 255, 77);
    height: 40px;
}

.callButtons {
    display: flex;
    flex-direction: column-reverse;
    width: 10%;
    border: solid 4px rgb(23, 251, 244);
}

.liftShaft {
    display: grid;
    grid-template-rows: repeat(v-bind('projSettings.floorCount'), 46px);
    width: 15%;
    border: solid 4px rgb(93, 235, 49);
    position: relative;

}

.liftExits {
    border: solid 3px rgb(101, 126, 216);
    height: 40px;
}

.lift {
    /* grid-row: v-bind('curFloor')/v-bind('curFloor'); */
    background-color: rgba(49, 235, 127, 0.508);
    width: 100%;
    height: 100%;
    position: absolute;

    display: flex; 
    justify-content: center; 
    align-items: center;
}

.liftBlink {
    /* grid-row: v-bind('curFloor')/v-bind('curFloor'); */
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
