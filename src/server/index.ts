import { log, TAG } from '@common';

on('onResourceStart', (resourceName: string) => {
    log('[' + TAG + '] Server resource started: ' + resourceName);
});