<script setup>
import { computed, ref, onMounted, reactive } from 'vue'

const projSettings = {
    liftCount: 1,
    floorCount: 7,
};

let floors = [];
for (let i = projSettings.floorCount; i > 0; i--) {
    floors.push(i)
}

let inProc = ref(false);

let liftOnFloor = ref(1);
let curFloor = ref(projSettings.floorCount + 1 - liftOnFloor.value);
let queueOfCalls = reactive(new Set());

let liftRef = ref(null);

let direction = ref(null);

async function stopWaiting(queue, q) {
    direction.value = 0;
    console.log('приехали на ' + q.floor);
    console.log(q.event.target)
    queue.delete(q);
    q.event.target.style.backgroundColor = 'bisque';

    liftRef.value.className = 'liftBlink';

    await delay(3000);
    liftRef.value.className = 'lift';
}

let nextFloor = ref(0);

async function moveLift(queue, liftPos) {
    inProc.value = true;
    // console.log('A')
    for (let q of queue) {
        // console.log('B')
        direction.value = getDirection(liftPos, q.floor);
        let counts = Math.abs(liftPos - q.floor);
        
        nextFloor.value = q.floor;

        for (let i = counts; i > 0; i--) {
            await delay(1000);
            liftPos = liftPos + direction.value;
            curFloor.value = projSettings.floorCount + 1 - liftPos;
            liftOnFloor.value = liftPos;
            // console.log(liftPos);
            // console.log(sec + ' мс');
        }
        await stopWaiting(queue, q);
        console.log(queue.size)
    }
    inProc.value = false;
}



function callLift(e, floorBtn) {
    console.log('--------',e.target)

    let objCall = {
        floor: floorBtn,
        event: e,
    };
    if (!queueOfCalls.has(objCall)) {
        e.target.style.backgroundColor = 'red';
        queueOfCalls.add(objCall);
        if (inProc.value == false) {
            moveLift(queueOfCalls, liftOnFloor.value);
        }
    }
    // console.log(queueOfCalls);
}

function delay(ms) {
    return new Promise((resolve, reject) => setTimeout(() => resolve(ms), ms));
}

function getDirection(from, to) {
    let dir = null;
    if (from < to) {
        dir = 1;
        // console.log('направление вверх ↑');
    } else {
        dir = -1;
        // console.log('направление вниз ↓');
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

        <div className="liftShaft">
            <div className="liftExits" :id="floor + '_floor'" v-for="floor in floors">
                <span :style="{ fontSize: 2 + 'rem' }">{{ floor }}</span>
            </div>

            <div ref="liftRef" className="lift">
                <span v-if="direction == 1">Вверх ↑ на {{ nextFloor }} этаж</span>
                <span v-else-if="direction == -1">Вниз ↓ на {{ nextFloor }} этаж</span>
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
    grid-row: v-bind('curFloor')/v-bind('curFloor');
    background-color: rgba(49, 235, 127, 0.508);
    width: 100%;
    height: 100%;
    position: absolute;

    display: flex; 
    justify-content: center; 
    align-items: center;
}

.liftBlink {
    grid-row: v-bind('curFloor')/v-bind('curFloor');
    width: 100%;
    height: 100%;
    position: absolute;

    animation-name: headerBlink;
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








@keyframes headerBlink {
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
