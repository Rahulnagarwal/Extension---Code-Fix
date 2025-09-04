import { UserPreferences } from '@common/types';

const KEY = 'codefixer:prefs';

export async function getPreferences(): Promise<UserPreferences | null> {
    return new Promise((resolve) => {
        chrome.storage.sync.get([KEY], (data) => {
            resolve((data[KEY] as UserPreferences) ?? null);
        });
    });
}

export async function setPreferences(prefs: UserPreferences): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [KEY]: prefs }, () => resolve());
    });
}


