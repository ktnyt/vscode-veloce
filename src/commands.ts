import * as vscode from 'vscode';

import * as count from './count';
import { compose, zip } from './functional';
import { Ring } from './ring';

export let enabled = true;
let disposable: vscode.Disposable | undefined;
let ring = new Ring<string[]>();
let savedSelections: vscode.Selection[] = [];

export let push0 = () => count.pushDigit(0);
export let push1 = () => count.pushDigit(1);
export let push2 = () => count.pushDigit(2);
export let push3 = () => count.pushDigit(3);
export let push4 = () => count.pushDigit(4);
export let push5 = () => count.pushDigit(5);
export let push6 = () => count.pushDigit(6);
export let push7 = () => count.pushDigit(7);
export let push8 = () => count.pushDigit(8);
export let push9 = () => count.pushDigit(9);
export let popDigit = () => count.popDigit();
export let resetCount = () => count.reset();

export async function executeCommand(command: string, ...rest: any[]) {
    await vscode.commands.executeCommand(command, ...rest);
}

export async function executeCommands(...commands: string[]) {
    for (const command of commands) {
        await vscode.commands.executeCommand(command);
    }
}

export function repeatCommand(command: string, ...rest: any[]) {
    count.run(async () => await executeCommand(command, ...rest));
}

export function repeatCommands(...commands: string[]) {
	count.run(async () => await executeCommands(...commands));
}

function getUserConfigCursorStyle(): vscode.TextEditorCursorStyle {
	let config = vscode.workspace.getConfiguration('editor');
	switch (config.get('cursorStyle')) {
	case 'block':
		return vscode.TextEditorCursorStyle.Block;
	case 'block-outline':
		return vscode.TextEditorCursorStyle.BlockOutline;
	case 'line':
		return vscode.TextEditorCursorStyle.Line;
	case 'line-thin':
		return vscode.TextEditorCursorStyle.LineThin;
	case 'underline':
		return vscode.TextEditorCursorStyle.Underline;
	case 'underline-thin':
		return vscode.TextEditorCursorStyle.UnderlineThin;
	default:
		return vscode.TextEditorCursorStyle.Line;
	}
}

type EditorAction = (editor: vscode.TextEditor) => void;
type ActionMap = { [key: string]: EditorAction };

export function cursorCollapseActive(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(collapseActive);
}

export function selectBuffer(editor: vscode.TextEditor) {
    let offset = editor.document.getText().length;
    let anchor = editor.document.positionAt(0);
    let active = editor.document.positionAt(offset);
    editor.selections = [new vscode.Selection(anchor, active)];
}

let mappings: ActionMap = {
    ';': cursorCollapseActive,
    '%': selectBuffer,
};

export async function handleEditorChange(editor?: vscode.TextEditor) {
    if (editor) {
        if (enabled) {
            await escape(editor);
        } else {
            await resume(editor);
        }
    }
}

export async function escape(editor: vscode.TextEditor) {
    disposable = vscode.commands.registerCommand('type', (event: { text: string }) => {
        [...event.text].forEach(async char => {
            if (char in mappings) {
                let action = mappings[char];
                action(editor);
            }
        });
    });
	await executeCommand('setContext', 'veloce.enabled', enabled = true);
	editor.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
}

export function restoreTypeCommand() {
    if (disposable !== undefined) {
		disposable.dispose();
		disposable = undefined;
	}
}

export async function resume(editor: vscode.TextEditor) {
    restoreTypeCommand();
	await executeCommand('setContext', 'veloce.enabled', enabled = false);
	editor.options.cursorStyle = getUserConfigCursorStyle();
}

export async function insert(editor: vscode.TextEditor) {
	await resume(editor);
	editor.selections = editor.selections.map(collapseStart);
}

export async function insertLineStart(editor: vscode.TextEditor) {
	await resume(editor);
	await executeCommand('cursorHome');
}

export async function insertLineAfter(editor: vscode.TextEditor) {
    await resume(editor);
    await executeCommand('editor.action.insertLineAfter');
}

export async function insertLineBefore(editor: vscode.TextEditor) {
    await resume(editor);
    await executeCommand('editor.action.insertLineBefore');
}

export async function append(editor: vscode.TextEditor) {
	await resume(editor);
	editor.selections = editor.selections.map(collapseEnd);
}

export async function appendLineEnd(editor: vscode.TextEditor) {
	await resume(editor);
	await executeCommand('cursorLineEnd');
}

export async function selectionCutInsert(editor: vscode.TextEditor) {
	cutSelected(editor);
	await insert(editor);
}

export async function selectionDeleteInsert(editor: vscode.TextEditor) {
	deleteSelected(editor);
	await insert(editor);
}

export function replaceCharacter(editor: vscode.TextEditor) {
    let selections = editor.selections;
    editor.selections = editor.selections.map(adjustSelectionRange);
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        editor.edit(editBuilder => {
            editor.selections.forEach(selection => {
                let start = editor.document.offsetAt(selection.start),
                    end = editor.document.offsetAt(selection.end);
                for (let offset = start; offset < end + 1; ++offset) {
                    let position = editor.document.positionAt(offset);
                    editBuilder.replace(position, value);
                }
            });
        });
        editor.selections = selections;
        inputBox.dispose();
    });
    inputBox.show();
}

export function collapseActive(selection: vscode.Selection): vscode.Selection {
    return new vscode.Selection(selection.active, selection.active);
}

export function collapseStart(selection: vscode.Selection): vscode.Selection {
    return new vscode.Selection(selection.start, selection.start);
}

export function collapseEnd(selection: vscode.Selection): vscode.Selection {
    return new vscode.Selection(selection.end, selection.end);
}

export function getSelectedText(editor: vscode.TextEditor): string[] {
    let selections = editor.selections;
    return selections.map(selection => editor.document.getText(selection.with()));
}

function adjustSelectionRange(selection: vscode.Selection): vscode.Selection {
    if (selection.start.isEqual(selection.end)) {
        return new vscode.Selection(selection.start, selection.end.translate(0, 1));
    }
    return selection;
}

export async function deleteSelected(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(adjustSelectionRange);
    await editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            editBuilder.delete(selection);
        }
    });
}

export async function cutSelected(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(adjustSelectionRange);
    let buffers = getSelectedText(editor);
    ring.push(buffers);
    deleteSelected(editor);
}

export async function copySelected(editor: vscode.TextEditor) {
    let selections = editor.selections;
    editor.selections = editor.selections.map(adjustSelectionRange);
    let buffers = getSelectedText(editor);
    editor.selections = selections;
    ring.push(buffers);
}

function paste(editor: vscode.TextEditor) {
    let buffers = ring.recent([]);
    editor.edit(editBuilder => {
        for (let i = 0; i < editor.selections.length; ++i) {
            let selection = editor.selections[i];
            let value = buffers[i % buffers.length];
            editBuilder.replace(selection, value);
        }
    }); 
}

export function pasteBefore(editor: vscode.TextEditor) {
    count.run(() => {
        editor.selections = editor.selections.map(collapseStart);
        paste(editor);
    });
}

export function pasteAfter(editor: vscode.TextEditor) {
    count.run(() => {
        editor.selections = editor.selections.map(compose(adjustSelectionRange, collapseEnd));
        paste(editor);
    });
}

export function pasteOver(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(adjustSelectionRange);
    paste(editor);
}

export function pastePrev(editor: vscode.TextEditor) {
    count.run(() => ring.prev());
    paste(editor);
}

export function pasteNext(editor: vscode.TextEditor) {
    count.run(() => ring.next());
    paste(editor);
}

export function saveSelections(editor: vscode.TextEditor) {
    savedSelections = editor.selections;
}

export function restoreSelections(editor: vscode.TextEditor) {
    if (savedSelections.length > 0) {
        editor.selections = savedSelections;
    }
}

export function cancelSelection(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(collapseActive);
}

export function cursorLeft(editor: vscode.TextEditor) {
    repeatCommands('veloce.cancelSelection', 'cursorLeft');
}

export function cursorLeftSelect() {
    repeatCommands('cursorLeftSelect');
}

export function cursorRight() {
    repeatCommands('veloce.cancelSelection', 'cursorRight');
}

export function cursorRightSelect() {
    repeatCommands('cursorRightSelect');
}

export function cursorUp() {
    repeatCommands('veloce.cancelSelection', 'cursorUp');
}

export function cursorUpSelect() {
    repeatCommands('cursorUpSelect');
}

export function cursorDown() {
    repeatCommands('veloce.cancelSelection', 'cursorDown');
}

export function cursorDownSelect() {
    repeatCommands('cursorDownSelect');
}

export function cursorWordStartLeftSelect() {
    repeatCommands('veloce.cancelSelection', 'cursorWordStartLeftSelect');
}

export function cursorWordStartLeftExtend() {
    repeatCommands('cursorWordStartLeftSelect');
}

export function cursorWordStartRightSelect() {
    repeatCommands('veloce.cancelSelection', 'cursorWordStartRightSelect');
}

export function cursorWordStartRightExtend() {
    repeatCommands('cursorWordStartRightSelect');
}
export function cursorWordEndRightSelect() {
    repeatCommands('veloce.cancelSelection', 'cursorWordEndRightSelect');
}

export function cursorWordEndRightExtend() {
    repeatCommands('cursorWordEndRightSelect');
}

export function cursorCharacterBeforeRightSelect(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(offset);
                let index = text.indexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.active, selection.active.translate(0, index));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterBeforeRightExtend(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(offset);
                let index = text.indexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.anchor, selection.active.translate(0, index));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterAfterRightSelect(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(offset);
                let index = text.indexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.active, selection.active.translate(0, index+1));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterAfterRightExtend(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(offset);
                let index = text.indexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.anchor, selection.active.translate(0, index+1));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterBeforeLeftSelect(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(0, offset);
                let index = text.lastIndexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.active, editor.document.positionAt(index));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterBeforeLeftExtend(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(0, offset);
                let index = text.lastIndexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.anchor, editor.document.positionAt(index));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterAfterLeftSelect(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(0, offset);
                let index = text.lastIndexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.active, editor.document.positionAt(index+1));
            });
        });
        inputBox.hide();
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorCharacterAfterLeftExtend(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    inputBox.onDidChangeValue(value => {
        count.run(() => {
            editor.selections = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.active);
                let text = editor.document.getText().substring(0, offset);
                let index = text.lastIndexOf(value);
                if (index < 0) {
                    return selection;
                }
                return new vscode.Selection(selection.anchor, editor.document.positionAt(index+1));
            });
        });
        inputBox.dispose();
    });
    inputBox.show();
}

export function cursorLineSelect(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(selection => {
        let start = new vscode.Position(selection.active.line, 0);
        let end = new vscode.Position(selection.active.line+1, 0);
        return new vscode.Selection(start, end);
    });
}

export function cursorLineExtend(editor: vscode.TextEditor) {
    editor.selections = editor.selections.map(selection => {
        let active = new vscode.Position(selection.active.line+1, 0);
        return new vscode.Selection(selection.anchor, active);
    });
}

export function smartExpand() {
    repeatCommands('editor.action.smartSelect.expand');
}

export function smartShrink() {
    repeatCommands('editor.action.smartSelect.shrink');
}

export function keepMatchingSelections(editor: vscode.TextEditor) {
    let selections = editor.selections;
    let inputBox = vscode.window.createInputBox();
    let accepted = false;
    inputBox.onDidAccept(_ => {
        accepted = true;
        inputBox.dispose();
    });
    inputBox.onDidHide(_ => {
        if (!accepted) {
            editor.selections = selections;
        }
    });
    inputBox.onDidChangeValue(value => {
        let filtered = selections.filter(selection => {
            let text = editor.document.getText(selection);
            let re = new RegExp(value, 'm');
            return text.search(re) > -1;
        });
        if (filtered.length > 0) {
            editor.selections = filtered;
        }
    });
    inputBox.show();
}

export function ignoreMatchingSelections(editor: vscode.TextEditor) {
    let selections = editor.selections;
    let inputBox = vscode.window.createInputBox();
    let accepted = false;
    inputBox.onDidAccept(_ => {
        accepted = true;
        inputBox.dispose();
    });
    inputBox.onDidHide(_ => {
        if (!accepted) {
            editor.selections = selections;
        }
    });
    inputBox.onDidChangeValue(value => {
        let filtered = selections.filter(selection => {
            let text = editor.document.getText(selection);
            let re = new RegExp(value, 'm');
            return text.search(re) < 0;
        });
        if (filtered.length > 0) {
            editor.selections = filtered;
        }
    });
    inputBox.show();
}

class Match {
    start: number;
    end: number;

    constructor(index: number, length: number) {
        this.start = index;
        this.end = index + length;
    }
};

function findMatches(str: string, re: RegExp): Match[] {
    let matches: Match[] = [];
    let result: RegExpExecArray | null;
    while((result = re.exec(str)) !== null) {
        matches.push(new Match(result.index, result[0].length));
    }
    return matches;
}

export function expressionSelect(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    let selections = editor.selections;
    let accepted = false;

    inputBox.onDidAccept(() => {
        accepted = true;
        inputBox.hide();
    });

    inputBox.onDidHide(() => {
        if (!accepted) {
            editor.selections = selections;
        }
        inputBox.dispose();
    });

    inputBox.onDidChangeValue(value => {
        if (value.length === 0) {
            editor.selections = selections;
        } else {
            let re = new RegExp(value, 'g');
            let groups = editor.selections.map(selection => {
                let offset = editor.document.offsetAt(selection.start);
                let text = editor.document.getText(selection);
                let matches = findMatches(text, re);
                return matches.map(match => {
                    let start = editor.document.positionAt(offset + match.start);
                    let end = editor.document.positionAt(offset + match.end);
                    return new vscode.Selection(start, end);
                });
            });
            editor.selections = groups.reduce((prev, next) => [...prev, ...next], []);
        }
    });

    inputBox.show();
}

export function expressionSplit(editor: vscode.TextEditor) {
    let inputBox = vscode.window.createInputBox();
    let selections = editor.selections;
    let accepted = false;

    inputBox.onDidAccept(() => {
        accepted = true;
        inputBox.hide();
    });

    inputBox.onDidHide(() => {
        if (!accepted) {
            editor.selections = selections;
        }
        inputBox.dispose();
    });

    inputBox.onDidChangeValue(value => {
        if (value.length === 0) {
            editor.selections = selections;
        } else {
            let re = new RegExp(value, 'g');
            let groups = editor.selections.map(selection => {
                let text = editor.document.getText(selection);
                let matches = findMatches(text, re);
                let toPosition = (offset: number) => editor.document.positionAt(offset);
                let starts = [selection.start, ...matches.map(match => match.end).map(toPosition)];
                let ends = [...matches.map(match => match.start).map(toPosition), selection.end];
                let ranges = zip(starts, ends);
                console.log(starts.length);
                return ranges.map(([start, end]) => new vscode.Selection(start, end));
            });
            editor.selections = groups.reduce((prev, next) => [...prev, ...next], []);
        }
    });

    inputBox.show();
}

export function insertCursorBelow() {
    repeatCommands('editor.action.insertCursorBelow');
}

export function insertCursorAbove() {
    repeatCommands('editor.action.insertCursorAbove');
}

function tryGetVisibleSelections(editor: vscode.TextEditor) {
    let { start, end } = editor.visibleRanges[0];
    let visibleSelections = editor.selections.filter(selection => {
        return start.line <= selection.active.line && selection.active.line <= end.line;
    });
    return visibleSelections.length > 0 ? visibleSelections : editor.selections;
}

export function scrollCursorPageTop(editor: vscode.TextEditor) {
    let selection = tryGetVisibleSelections(editor).shift();
    if (selection) {
        let lineNumber = selection.start.line;
        let at = 'top';
        vscode.commands.executeCommand('revealLine', { lineNumber, at });
    }
}

export function scrollCursorPageCenter(editor: vscode.TextEditor) {
    let selection = tryGetVisibleSelections(editor).shift();
    if (selection) {
        let lineNumber = selection.active.line;
        let at = 'center';
        vscode.commands.executeCommand('revealLine', { lineNumber, at });
    }
}

export function scrollCursorPageBottom(editor: vscode.TextEditor) {
    let selection = tryGetVisibleSelections(editor).pop();
    if (selection) {
        let lineNumber = selection.start.line;
        let at = 'bottom';
        vscode.commands.executeCommand('revealLine', { lineNumber, at });
    }
}

export function undo() {
    repeatCommand('undo');
}

export function redo() {
    repeatCommand('redo');
}