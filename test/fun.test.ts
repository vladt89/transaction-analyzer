
describe('Test', () => {
    it('test', async () => {
        const result = fun(5, -2);
        expect(result).toEqual(-10)
    });
});

function fun(a: number, b: number) {
    let aPositive = a
    if (a < 0) {
        aPositive = a * (-1)
    }
    let bPositive = b
    if (b < 0) {
        bPositive = b * (-1)
    }
    let result = 0
    for (let i = 0; i < bPositive; i++) {
        result += aPositive
    }
    if (a > 0 && b > 0 || a < 0 && b < 0) {
        return result
    } else {
    // if (a < 0 || b < 0) {
        return result * (-1)
    }
}
