export class IterablePairIterator<T = unknown> {
    private readonly iterators: Array<Iterable<T>> = [];

    constructor(...iterators: Array<Iterable<T>>) {
        this.iterators = iterators;
    }

    *[Symbol.iterator](): Iterator<[T, T]> {
        for (const [a, b] of this.pairs(this.iterators)) {
            for (const one of a) {
                for (const two of b) {
                    yield [one, two];
                }
            }
        }
    }

    private pairs(source: Array<Iterable<T>>): Array<[Iterable<T>, Iterable<T>]> {
        return source.map((a, i) => source.slice(i + 1).map((b) => [a, b])).flat() as Array<[Iterable<T>, Iterable<T>]>;
        // return source.reduce((carry, a) => carry.concat(source.filter((b) => a !== b).map((b) => [a, b])), [] as Array<[Iterable<T>, Iterable<T>]>);
    }
}