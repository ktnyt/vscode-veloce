import * as vscode from 'vscode';

let statusBarCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

export let value = 0;

export function run(target: () => void) {
    for (let i = 0; i < Math.max(1, value); ++i) {
        target();
    }
    reset();
}

function updateStatusBar() {
    if (value === 0) {
        statusBarCount.text = '';
        statusBarCount.hide();
    } else {
        statusBarCount.text = `${value}`;
        statusBarCount.show();
    }
}

export function pushDigit(digit: number) {
    value *= 10;
    value += digit;
    updateStatusBar();
}

export function popDigit() {
    value = Math.floor(value / 10);
    updateStatusBar();
}

export function reset() {
    value = 0;
    updateStatusBar();
}