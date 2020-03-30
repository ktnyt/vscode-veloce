import * as vscode from 'vscode';
import * as commands from './commands';

export function nop() { console.log('nop'); }

export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		// Mode switching commands.
		vscode.commands.registerTextEditorCommand('veloce.escape', commands.escape),
		vscode.commands.registerTextEditorCommand('veloce.insert', commands.insert),
		vscode.commands.registerTextEditorCommand('veloce.insertLineStart', commands.insertLineStart),
		vscode.commands.registerTextEditorCommand('veloce.append', commands.append),
		vscode.commands.registerTextEditorCommand('veloce.appendLineEnd', commands.appendLineEnd),
		vscode.commands.registerTextEditorCommand('veloce.selectionCutInsert', commands.selectionCutInsert),
		vscode.commands.registerTextEditorCommand('veloce.selectionDeleteInsert', commands.selectionDeleteInsert),
		vscode.commands.registerTextEditorCommand('veloce.insertLineAfter', commands.insertLineAfter),
		vscode.commands.registerTextEditorCommand('veloce.insertLineBefore', commands.insertLineBefore),

		// Clipboard commands.
		vscode.commands.registerTextEditorCommand('veloce.cutSelected', commands.cutSelected),
		vscode.commands.registerTextEditorCommand('veloce.copySelected', commands.copySelected),
		vscode.commands.registerTextEditorCommand('veloce.pasteBefore', commands.pasteBefore),
		vscode.commands.registerTextEditorCommand('veloce.pasteAfter', commands.pasteAfter),
		vscode.commands.registerTextEditorCommand('veloce.pasteOver', commands.pasteOver),
		vscode.commands.registerTextEditorCommand('veloce.pastePrev', commands.pastePrev),
		vscode.commands.registerTextEditorCommand('veloce.pasteNext', commands.pasteNext),

		// Selection commands.
		vscode.commands.registerTextEditorCommand('veloce.cancelSelection', commands.cancelSelection),
		vscode.commands.registerCommand('veloce.cursorLeft', commands.cursorLeft),
		vscode.commands.registerCommand('veloce.cursorLeftSelect', commands.cursorLeftSelect),
		vscode.commands.registerCommand('veloce.cursorRight', commands.cursorRight),
		vscode.commands.registerCommand('veloce.cursorRightSelect', commands.cursorRightSelect),
		vscode.commands.registerCommand('veloce.cursorUp', commands.cursorUp),
		vscode.commands.registerCommand('veloce.cursorUpSelect', commands.cursorUpSelect),
		vscode.commands.registerCommand('veloce.cursorDown', commands.cursorDown),
		vscode.commands.registerCommand('veloce.cursorDownSelect', commands.cursorDownSelect),
		vscode.commands.registerCommand('veloce.cursorWordStartLeftSelect', commands.cursorWordStartLeftSelect),
		vscode.commands.registerCommand('veloce.cursorWordStartLeftExtend', commands.cursorWordStartLeftExtend),
		vscode.commands.registerCommand('veloce.cursorWordStartRightSelect', commands.cursorWordStartRightSelect),
		vscode.commands.registerCommand('veloce.cursorWordStartRightExtend', commands.cursorWordStartRightExtend),
		vscode.commands.registerCommand('veloce.cursorWordEndRightSelect', commands.cursorWordEndRightSelect),
		vscode.commands.registerCommand('veloce.cursorWordEndRightExtend', commands.cursorWordEndRightExtend),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterBeforeRightSelect', commands.cursorCharacterBeforeRightSelect),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterBeforeRightExtend', commands.cursorCharacterBeforeRightExtend),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterAfterRightSelect', commands.cursorCharacterAfterRightSelect),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterAfterRightExtend', commands.cursorCharacterAfterRightExtend),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterBeforeLeftSelect', commands.cursorCharacterBeforeLeftSelect),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterBeforeLeftExtend', commands.cursorCharacterBeforeLeftExtend),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterAfterLeftSelect', commands.cursorCharacterAfterLeftSelect),
		vscode.commands.registerTextEditorCommand('veloce.cursorCharacterAfterLeftExtend', commands.cursorCharacterAfterLeftExtend),
		vscode.commands.registerTextEditorCommand('veloce.cursorLineSelect', commands.cursorLineSelect),
		vscode.commands.registerTextEditorCommand('veloce.cursorLineExtend', commands.cursorLineExtend),
		vscode.commands.registerCommand('veloce.smartExpand', commands.smartExpand),
		vscode.commands.registerCommand('veloce.smartShrink', commands.smartShrink),
		vscode.commands.registerTextEditorCommand('veloce.keepMatchingSelections', commands.keepMatchingSelections),
		vscode.commands.registerTextEditorCommand('veloce.ignoreMatchingSelections', commands.ignoreMatchingSelections),
		vscode.commands.registerTextEditorCommand('veloce.expressionSelect', commands.expressionSelect),
		vscode.commands.registerTextEditorCommand('veloce.expressionSplit', commands.expressionSplit),

		// Cursor manipulation commands.
		vscode.commands.registerCommand('veloce.insertCursorBelow', commands.insertCursorBelow),
		vscode.commands.registerCommand('veloce.insertCursorAbove', commands.insertCursorAbove),

		// Scrolling commands.
		vscode.commands.registerTextEditorCommand('veloce.scrollCursorPageTop', commands.scrollCursorPageTop),
		vscode.commands.registerTextEditorCommand('veloce.scrollCursorPageCenter', commands.scrollCursorPageCenter),
		vscode.commands.registerTextEditorCommand('veloce.scrollCursorPageBottom', commands.scrollCursorPageBottom),

		// Count commands.
		vscode.commands.registerCommand('veloce.push0', commands.push0),
		vscode.commands.registerCommand('veloce.push1', commands.push1),
		vscode.commands.registerCommand('veloce.push2', commands.push2),
		vscode.commands.registerCommand('veloce.push3', commands.push3),
		vscode.commands.registerCommand('veloce.push4', commands.push4),
		vscode.commands.registerCommand('veloce.push5', commands.push5),
		vscode.commands.registerCommand('veloce.push6', commands.push6),
		vscode.commands.registerCommand('veloce.push7', commands.push7),
		vscode.commands.registerCommand('veloce.push8', commands.push8),
		vscode.commands.registerCommand('veloce.push9', commands.push9),
		vscode.commands.registerCommand('veloce.popDigit', commands.popDigit),
		vscode.commands.registerCommand('veloce.resetCount', commands.resetCount),

		// Utility commands.
		vscode.commands.registerCommand('veloce.undo', commands.undo),
		vscode.commands.registerCommand('veloce.redo', commands.redo),
		vscode.commands.registerCommand('veloce.nop', nop),
		vscode.window.onDidChangeActiveTextEditor(commands.handleEditorChange),
	);
}

export async function deactivate() {
	commands.restoreTypeCommand();
}