export const TAG = 'TEMPLATE';

export function log(...args: any[]) {
    if (IsDuplicityVersion())
        console.log('\x1b[90m[' + new Date().toTimeString().split(' ')[0] + ']\x1b[0m', ...args);
    else 
        console.log('[' + new Date().toTimeString().split(' ')[0] + ']', ...args);
}

export function error(...args: any[]) {
    if (IsDuplicityVersion())
        console.log('\x1b[90m[' + new Date().toTimeString().split(' ')[0] + ']\x1b[91m', ...args, '\x1b[0m');
    else 
        console.log('[' + new Date().toTimeString().split(' ')[0] + ']', ...args);
}