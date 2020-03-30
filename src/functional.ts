export type Map<T> = (arg: T) => T;

export function compose<T>(...fs: Map<T>[]): Map<T> {
    return arg => fs.reduce((prev, curr) => curr(prev), arg);
}

export function zip<T, U>(a: T[], b: U[]): (T | U)[][] {
    let ret: (T | U)[][] = [];
    for (let i = 0; i < a.length && i < b.length; i++) {
        ret.push([a[i], b[i]]);
    }
    return ret;
}