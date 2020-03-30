import re
import json


def binding(key):
    return dict(key=key, command='veloce.nop', when='editorTextFocus && veloce.activated && veloce.enabled')


def bindings(key):
    return [binding(key), binding('Alt+'+key), binding('Ctrl+'+key)]


def main():
    digit = '0123456789'
    alpha = 'abcdefghijklmnopqrstuvwxyz'
    lst = [binding('escape')]

    for code in digit:
        lst += [binding(code)]

    for code in alpha:
        lst += bindings(code)
        lst += bindings('Shift+'+code)

    dump = json.dumps(lst, indent=4)
    dump = dump.replace('    ', '\t')
    print(dump)


if __name__ == '__main__':
    main()
