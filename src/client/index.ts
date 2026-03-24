import { log, TAG } from '@common';


on('onResourceStart', (resourceName: string) => {
    if (resourceName !== GetCurrentResourceName()) 
        return;
    
    log('[' + TAG + '] Client resource started: ' + resourceName);
});