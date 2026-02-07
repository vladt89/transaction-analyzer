export interface Expenses {
    food: number,
    houseAndFurniture: number,
    carAndTransport: number,
    kids: number,
    insurance: number,
    travel: number,
    sportEatFun: number,
    health: number,
    invest: number,
    other: number,
    sum: number
}

export type CategoryKey = keyof Omit<Expenses, 'sum'>;