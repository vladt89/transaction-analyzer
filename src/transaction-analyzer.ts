import type { Transaction } from "./entities/transaction";
import Papa, {ParseResult} from "papaparse";
import {CategoryDefinition} from "./entities/category";
import {CategoryKey, Expenses} from "./entities/expenses";
import {
    FOOD_SHOPS_SHORT_NAMES,
    HOUSE_SHOPS_SHORT_NAMES,
    CAR_TRANSPORT_SHOPS_SHORT_NAMES,
    KIDS_FAMILY_NAMES,
    INSURANCE_NAMES,
    TRAVEL_NAMES,
    SPORT_FOOD_FUN_NAMES,
    HEALTH_NAMES,
    INVEST_NAMES,
} from "./resources/default-categories";

type StringRecord = Record<string, string>;

const SKIP_SHOPS_SHORT_NAMES = [
    "ATM",
    // "ROMANOV ALEKSANDR", "Foundation For Student Housing",
    // "Autodoc AG", // Vasya
    // "VERKKOKAUPPA.COM MYYMALAT", // monitor
    // "Paysend EU", "Every Day Use OP", "Mw A Shutova", "Valery Selenin", // personal
    // "NH COLLECTION MILANO CITY", // Milan trip
    // "PIHLAJALINNA HA", //Partio insurance should cover
    // "AUTODOC", "KLM", // returned
    "TIKHOMIROV VLADIMIR",
    "Vladimir Tikhomirov",
    "Interactive Brokers", "Bitstamp", // investments, which are not expenses as such
    // "Lahitapiola Rahoitus", // Valentin
    // "Jusek Adlersztejn", // deposit for Berlin's flat
    "AMAZON* R46Z74LV4", // kinderwagen that we returned
    // FLAT
    "ARTUR KARAZANOV", // not in personal finance
    "Paytrail Oyj DNA Oyj Mobiilipa", // flat internet
    "Helen Oy", // electricity
];

const DEFAULT_CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
    { key: 'food', merchantShortNames: FOOD_SHOPS_SHORT_NAMES },
    { key: 'houseAndFurniture', merchantShortNames: HOUSE_SHOPS_SHORT_NAMES },
    { key: 'carAndTransport', merchantShortNames: CAR_TRANSPORT_SHOPS_SHORT_NAMES },
    { key: 'kids', merchantShortNames: KIDS_FAMILY_NAMES },
    { key: 'insurance', merchantShortNames: INSURANCE_NAMES },
    { key: 'travel', merchantShortNames: TRAVEL_NAMES },
    { key: 'sportEatFun', merchantShortNames: SPORT_FOOD_FUN_NAMES },
    { key: 'health', merchantShortNames: HEALTH_NAMES },
    { key: 'invest', merchantShortNames: INVEST_NAMES },
];

type TransactionDetails = { amount: number, shop: string, date: Date };

export class TransactionAnalyzer {

    /**
     * UI-friendly entrypoint: pass CSV file content and (optionally) the bank format.
     * Returns the computed analysis object (no filesystem writes).
     */
    async analyzeCsvContent(
        fileContent: string,
        bankName: 'Nordea' | 'ING' | 'Commerzbank' = 'Nordea',
        fileName?: string,
        categoryDefinitions?: readonly CategoryDefinition[]
    ) {
        const detectedBankName: 'Nordea' | 'ING' | 'Commerzbank' =
            fileName?.toLowerCase().includes('commerz') ? 'Commerzbank' : bankName;

        const transactions = await this.parseTransactionFiles(fileContent, detectedBankName);
        return this.analyze(transactions, categoryDefinitions);
    }

    async parseTransactionFiles(fileContent: string, bankName?: string): Promise<Transaction[]> {
        let headers: string[];
        if (bankName === 'Nordea') {
            headers = ['bookingDate', 'amount', 'sender', 'recipient', 'name', 'title', 'message', 'referenceNumber', 'balance', 'currency', 'empty'];
        } else if (bankName === 'Commerzbank') {
            // Buchungstag;Wertstellung;Umsatzart;Buchungstext;Betrag;Währung;IBAN Kontoinhaber;Kategorie
            headers = [
                'bookingDate',        // Buchungstag
                'valueDate',          // Wertstellung
                'bookingType',        // Umsatzart
                'title',              // Buchungstext
                'amount',             // Betrag
                'currency',           // Währung
                'sender',             // IBAN Kontoinhaber (not used in analysis, but kept)
                'name'                // Kategorie (kept for future)
            ];
        } else { // ING
            headers = [
                'Buchung',
                'bookingDate', //'Wertstellungsdatum',
                'title', // 'Auftraggeber/Empf�nger',
                'Buchungstext',
                'referenceNumber', // 'Verwendungszweck',
                'Saldo', // 'Saldo',
                'W�hrung',
                'amount', //'Betrag',
                'W�hrung'
            ];
        }

        return new Promise<Transaction[]>((resolve, reject) => {
            Papa.parse<string[]>(fileContent, {
                delimiter: ";",
                skipEmptyLines: true,
                header: false,              // we supply our own headers
                quoteChar: '"',
                complete: (results: ParseResult<string[]>) => {
                    if (results.errors.length) {
                        reject(new Error(results.errors[0].message));
                        return;
                    }

                    let rows = results.data;

                    // Optional: skip the first row if it looks like the CSV header row
                    if (rows.length && this.isProbablyHeaderRow(rows[0])) {
                        rows = rows.slice(1);
                    }

                    const transactions: Transaction[] = rows.map((row: string[]) => {
                        const rec = this.rowToRecord(headers, row);
                        return this.pickTransaction(rec);
                    });

                    resolve(transactions);
                },
                error: (err: unknown) => reject(err),
            });
        });
    }

    isProbablyHeaderRow(row: readonly string[]): boolean {
        // adjust to your actual CSV; this is a safe generic check
        return row.some((c) => {
            const lc = c.toLowerCase();
            return (
                lc.includes('booking date') ||
                lc.includes('wertstellungsdatum') ||
                lc.includes('buchungstag') ||
                lc.includes('buchungstext')
            );
        });
    }

    rowToRecord(headers: readonly string[], row: readonly string[]): StringRecord {
        const out: StringRecord = {};
        for (let i = 0; i < headers.length; i++) {
            out[headers[i]] = row[i] ?? "";
        }
        return out;
    }

    pickTransaction(rec: StringRecord): Transaction {
        // Only pick what your analyzer actually uses.
        // Note: your code uses transaction.title, bookingDate, amount, referenceNumber.
        return {
            bookingDate: rec.bookingDate ?? "",
            amount: rec.amount ?? "",
            sender: rec.sender ?? "",
            recipient: rec.recipient ?? "",
            name: rec.name ?? "",
            title: rec.title ?? "",
            referenceNumber: rec.referenceNumber ?? rec.message ?? "",
            balance: rec.balance ?? "",
            currency: rec.currency ?? "",
        };
    }

    /**
     * The core function which does the transaction analysis.
     *
     * @param transactions transactions that are needed to be analysed
     * @param categoryDefinitions optional category definitions for merchant matching
     */
    analyze(
        transactions: Transaction[],
        categoryDefinitions: readonly CategoryDefinition[] = DEFAULT_CATEGORY_DEFINITIONS
    ): { averageMonthExpenses: string, monthlyExpenses: any[] } {
        const monthExpenses = new Map<string, Expenses>();
        const transactionsByCategory: Record<CategoryKey, TransactionDetails[]> = {
            food: [],
            houseAndFurniture: [],
            carAndTransport: [],
            kids: [],
            insurance: [],
            travel: [],
            sportEatFun: [],
            health: [],
            invest: [],
            other: [],
        };
        for (const transaction of transactions) {
            const shop = transaction.title;
            if (this.skip(transaction, shop, SKIP_SHOPS_SHORT_NAMES)) {
                continue;
            }
            let bookingDate = transaction.bookingDate;
            if (bookingDate === "Reserved") { // skip transactions that were not completed
                continue;
            }
            if (bookingDate.includes('.')) {
                const split = bookingDate.split('.');
                bookingDate = split[2] + "/" + split[1] + "/" + split[0];
            }
            let date = new Date(Date.parse(bookingDate));
            const month = this.getMonth(date);
            if (transaction.amount.includes(",")) {
                const commaSplit = transaction.amount.split(",");
                transaction.amount = transaction.amount.replace(",", "");
                if (commaSplit[1].length == 1) {
                    transaction.amount = transaction.amount + "0";
                }
            } else {
                transaction.amount = transaction.amount + "00";
            }
            const amountCents = Number.parseInt(transaction.amount);
            if (amountCents > 0) { // NOTE: we don't care about the income as we want to analyze the expenses
                continue;
            }
            let expenses: Expenses | undefined = monthExpenses.get(month);
            let updateExpenses: Expenses;
            if (expenses == undefined) {
                updateExpenses = {
                    food: 0,
                    houseAndFurniture: 0,
                    carAndTransport: 0,
                    kids: 0,
                    insurance: 0,
                    travel: 0,
                    sportEatFun: 0,
                    health: 0,
                    invest: 0,
                    other: 0,
                    sum: amountCents
                };
            } else {
                updateExpenses = {
                    food: expenses.food,
                    houseAndFurniture: expenses.houseAndFurniture,
                    carAndTransport: expenses.carAndTransport,
                    kids: expenses.kids,
                    insurance: expenses.insurance,
                    travel: expenses.travel,
                    sportEatFun: expenses.sportEatFun,
                    health: expenses.health,
                    invest: expenses.invest,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
            }
            const transactionDetails: TransactionDetails = { amount: Math.abs(amountCents), shop, date };

            let matchedCategory: CategoryKey = 'other';
            for (const def of categoryDefinitions) {
                if (this.matchShop(shop, def.merchantShortNames)) {
                    matchedCategory = def.key;
                    break;
                }
            }

            // Update the selected category bucket (keep identical math to the previous if/else chain)
            (updateExpenses as any)[matchedCategory] = ((expenses as any)?.[matchedCategory] ?? 0) + amountCents;
            transactionsByCategory[matchedCategory].push(transactionDetails);

            monthExpenses.set(month, updateExpenses);
            const sum = updateExpenses.food + updateExpenses.houseAndFurniture + updateExpenses.carAndTransport
                + updateExpenses.kids + updateExpenses.insurance + updateExpenses.travel + updateExpenses.sportEatFun
                + updateExpenses.health + updateExpenses.invest + updateExpenses.other;
            if (updateExpenses.sum != sum) {
                console.error("Sum is wrong");
                throw new Error("Sum is wrong");
            }
        }

        return this.analyzeMonthlyExpenses(monthExpenses, transactionsByCategory);
    }

    private getMonth(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    }

    private analyzeMonthlyExpenses(
        monthExpenses: Map<any, Expenses>,
        transactionsByCategory: Record<CategoryKey, TransactionDetails[]>
    ): { averageMonthExpenses: string, monthlyExpenses: any[] } {
        let polishedExpenses: any[] = [];
        let allFileSumma = 0;
        for (const month of monthExpenses.keys()) {
            const expenses = monthExpenses.get(month);
            if (!expenses) {
                throw new Error("Error: expenses for " + month + " are not defined");
            }
            const monthSumma: number = expenses.sum;
            allFileSumma += monthSumma;
            const foodAmount: number = expenses.food;
            const houseAndFurnitureAmount: number = expenses.houseAndFurniture;
            const carAndTransportAmount = expenses.carAndTransport;
            const travelAmount = expenses.travel;
            const sportEatFunAmount = expenses.sportEatFun;
            const otherAmount = expenses.other;
            const kidsAmount = expenses.kids;
            const insuranceAmount = expenses.insurance;
            const investAmount = expenses.invest;
            const healthAmount = expenses.health;
            polishedExpenses.push({
                month,
                sum: this.centsToFloatEuros(monthSumma) + " euros",
                categories: {
                    food: {
                        amount: this.centsToFloatEuros(foodAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(foodAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.food, month)
                    },
                    houseAndFurniture: {
                        amount: this.centsToFloatEuros(houseAndFurnitureAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(houseAndFurnitureAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.houseAndFurniture, month)
                    },
                    carAndTransport: {
                        amount: this.centsToFloatEuros(carAndTransportAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(carAndTransportAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.carAndTransport, month)
                    },
                    kids: {
                        amount: this.centsToFloatEuros(kidsAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(kidsAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.kids, month)
                    },
                    insurance: {
                        amount: this.centsToFloatEuros(insuranceAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(insuranceAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.insurance, month)
                    },
                    travel: {
                        amount: this.centsToFloatEuros(travelAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(travelAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.travel, month)
                    },
                    sportEatFun: {
                        amount: this.centsToFloatEuros(sportEatFunAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(sportEatFunAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.sportEatFun, month)
                    },
                    health: {
                        amount: this.centsToFloatEuros(healthAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(healthAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.health, month)
                    },
                    invest: {
                        amount: this.centsToFloatEuros(investAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(investAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.invest, month)
                    },
                    other: {
                        amount: this.centsToFloatEuros(otherAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(otherAmount, monthSumma),
                        transactions: this.transactionsToJson(transactionsByCategory.other, month)
                    }
                }
            });
        }

        const monthCount = monthExpenses.size;
        if (monthCount === 0) {
            return {
                averageMonthExpenses: '0 euros',
                monthlyExpenses: []
            };
        }

        const averageMonthExpenses = Math.round((this.centsToFloatEuros(allFileSumma) / monthCount) * 100) / 100;
        const averageMonthExpensesStr = averageMonthExpenses + " euros";
        console.log(averageMonthExpensesStr + " is average monthly expenses during the period of " + monthCount + " month(s)");
        const entirePeriodExpenses = averageMonthExpenses * monthCount;
        console.log("Spent during entire period: " + entirePeriodExpenses);

        return {
            averageMonthExpenses: averageMonthExpensesStr,
            monthlyExpenses: polishedExpenses
        };
    }

    private static calculatePercentage(categoryAmountCents: number, monthSummaCents: number) {
        return Math.round((Math.abs(categoryAmountCents / monthSummaCents) * 100) * 100) / 100;
    }

    private getCategoryAnalysis(expenses: [any, any], topHouseAndFurniture: any[], month: any) {
        const cents = expenses[1].houseAndFurniture;
        let transactionSum = 0;
        for (const transaction of topHouseAndFurniture) {
            transactionSum += transaction.amount;
        }
        if (transactionSum != cents) {
            console.error("Month's expenses are not matching");
        }
        return {
            amount: this.centsToFloatEuros(cents),
            percentage: Number.parseInt(((cents / expenses[1].sum) * 100).toString()),
            transactions: this.transactionsToJson(topHouseAndFurniture, month)
        };
    }

    // using array because Map misses some transactions because the key is the amount which can be repeating
    private transactionsToJson(transactions: TransactionDetails[], currentMonth: string) {
        let result: any = {};
        function compare(tr1: TransactionDetails, tr2: TransactionDetails) {
            if (tr1.amount > tr2.amount) {
                return -1;
            }
            return 0;
        }
        const sortedTransactions = transactions.sort(compare);
        let transactionsSum = 0;
        let monthlyTransactionCount = 0;
        for (let i = 0; i < sortedTransactions.length; i++) {
            const topTransaction = transactions[i];
            const transactionDate = new Date(topTransaction.date);
            const month = this.getMonth(transactionDate);
            if (month === currentMonth) {
                monthlyTransactionCount++;
                const amount = topTransaction.amount;
                transactionsSum += amount;
                result[monthlyTransactionCount] = "spent " + this.centsToFloatEuros(amount)
                    + " euros in " + topTransaction.shop + " on " + transactionDate.toDateString();
            }
        }
        if (transactionsSum > 0) {
            const averageTransactionAmount = Math.floor(transactionsSum / monthlyTransactionCount);
            result["on average"] = "spent " + this.centsToFloatEuros(averageTransactionAmount) + " euros";
        }
        return result;
    }

    centsToFloatEuros(amount: number): number {
        const strAmount = Math.abs(amount).toString();
        if (amount == 0) {
            return 0;
        }
        const mainPart = strAmount.slice(0, strAmount.length - 2);
        const restPart = strAmount.slice(strAmount.length - 2);
        return Number.parseFloat(mainPart + "." + restPart);
    }

    private skip(transaction: Transaction, shop: string, shopShortNames: string[]) {
        const skipFirstRow = transaction.bookingDate.endsWith("Booking date") || transaction.bookingDate === 'Wertstellungsdatum';
        if (!skipFirstRow) {
            for (const shortShopName of shopShortNames) {
                if (shop.toLowerCase().includes(shortShopName.toLowerCase())) {
                    return true;
                }
            }
        } else {
            return skipFirstRow;
        }
        return false;
    }

    private matchShop(shop: string, shopShortNames: string[]) {
        for (const shortShopName of shopShortNames) {
            if (shop.toLowerCase().includes(shortShopName.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
