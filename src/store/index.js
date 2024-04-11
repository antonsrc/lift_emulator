import { defineStore } from 'pinia'

const STORE_NAME = 'main';

const getDefaultSettings = () => ({
    fontSize: 14,
    tabSize: 2,
    zoomLevel: 0,
})

const getSettings = () => {
    const settings = localStorage.getItem(STORE_NAME);
    return settings ? JSON.parse(settings) : getDefaultSettings();
}

export const useStore = defineStore(STORE_NAME, {
    state: () => ({
        settings: getSettings(),
    }),
    actions: {
        update(extraSettings) {
            this.settings = { ...this.settings, ...extraSettings, };
            localStorage.setItem(STORE_NAME, JSON.stringify(this.settings));
        },
    },
})

