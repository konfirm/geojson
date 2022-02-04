/**
 * Iterator class which traverses all value pairs of two or more Iterable instances
 *
 * @export
 * @class IterablePairIterator
 * @template T
 */
export class IterablePairIterator<T = unknown> {
    private readonly iterators: Array<Iterable<T>> = [];

    /**
     * Constructs a new instance of IterablePairIterator
     * 
     * @param iterators 
     */
    constructor(...iterators: [Iterable<T>, Iterable<T>, ...Array<Iterable<T>>]) {
        this.iterators = iterators;
    }

    /**
     * Generator yielding all value pairs from the provided iterators
     *
     * @return {*}  {Iterator<[T, T]>}
     * @memberof IterablePairIterator
     */
    *[Symbol.iterator](): Iterator<[T, T]> {
        for (const [a, b] of this.pairs(this.iterators)) {
            for (const one of a) {
                for (const two of b) {
                    yield [one, two];
                }
            }
        }
    }

    /**
     * Create unique Iterator<T> combinations to traverse over
     *
     * @private
     * @param {Array<Iterable<T>>} source
     * @return {*}  {Array<[Iterable<T>, Iterable<T>]>}
     * @memberof IterablePairIterator
     */
    private pairs(source: Array<Iterable<T>>): Array<[Iterable<T>, Iterable<T>]> {
        return source.map((a, i) => source.slice(i + 1).map((b) => [a, b])).flat() as Array<[Iterable<T>, Iterable<T>]>;
    }
}