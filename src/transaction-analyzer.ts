import Papa, {ParseResult} from "papaparse";

type Transaction = {
    bookingDate: string;
    amount: string;
    sender: string;
    recipient: string;
    name: string;
    title: string;
    referenceNumber: string;
    balance: string;
    currency: string;
};

interface Expenses {
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

const FOOD_SHOPS_SHORT_NAMES = ["ALEPA", "LIDL", "PRISMA", "K-supermarket", "K-market", "S-Market", "K-Citymarket",
    "K market", "MINIMARKET", "S MARKET", "LENTA", "EDEKA", "PEREKRESTOK", "DISAS",
    "Netto", "KAUFLAND", "ALDI", // german food shops
    "RIMI", // estonian food shop
    "REWE",
    "MERCADONA",
    "SUPERMERCADOS",
    "ELLI",
    "ZABKA", // Polish supermarket
    "CONSUM",
];
const HOUSE_SHOPS_SHORT_NAMES = ["Asunto Oy Kuparikartano", "IKEA", "K-Rauta", "Helen Oy", "TIKHOMIROV V TAI WEINER C",
    "Elisa Oyj", "BAUHAUS", "BAUMARKT", "MIKKO UGOLNIKOV", "Gigantti",
    "DNA", // internet
    "BILTEMA",
    "AURORANLINNA", // renting
    "HOUSINGANY", // Berlin renting
    "KUMAR RAJU", // bed
    "LVI PALVELU TUKIAINEN", // Hana installation
    "Von Haugwitz Gotthard", // Lippstadt renting
    "Vodafone",
    "ACTION 3038", // Erwitte
    "MONTANA", // electricity
    "MEDIA MARKT",
    "Rundfunk ARD, ZDF, DRadio",
    "ROSSMANN",
    "JYSK",
    "MEDIAMARKT",
    "ARTUR KARAZANOV",
];
const KIDS_FAMILY_NAMES = ["Phoenix Partners Ky/LaughLearn", "MUSTI JA MIRRI", "VETKLINIKA VOLF", "EVGENIJA KRUGLOVA",
    "PERHEKESKUS MARIA RY", "Seikkailupuisto Korkee", "HIIHTOSEURA",
    "HOPLOP", "Voimisteluseura",
    "TWI SERVICES OY", // Russian visa
    "CHESS GALAXY",
    "HELSINGIN UIMARIT",
    "Christina Weiner FI",
    "HGIN KAUPUNKI/ TALPA/LASKUTUS", // продленка
    "BADMINTON CLUB",
    "Cetus Espoo ry", // swim
    "IVANCHSHICOVA", "Yelena Simonenko",
    "KORKEASAAREN ELAIN",
    "SUOMISPORT", // chess license for Leo
    "Christina Weiner", // aliments
    "HELSINGIN KAUPUNKI", // продленка
    "Perhekeskus Maria",
];
const SPORT_FOOD_FUN_NAMES = ["TALIHALLI", "ACTIVE GROUP RY", "VFI*Rami's Coffee Oy", "Inna Repo", "Asian Fusion Oy",
    "SEIKKAILUPUISTO ZIPPY", "INTER RAVINTOLA", "INTER PIZZA", "Electrobike", "XXL", "RESTAURANT", "PoplaCandy",
    "ABC", "BK KONALA", "CAFE", "CITY OF HELSINKI", "Wilhelm Breimaier", "Intelinvest", "RAVINTOLA", "PIZZERIA",
    "Eat Poke Hki Oy", "HIEKKA BEACHSPOT OY", "HSBIKEDISCO", "DIGICLOUDTR", "Taste Creator Oy", "HESBURGER",
    "OCR Factory", "IGELS", "TONI PITKANEN", "Kiipeilyvisio Oy", "FREE MOTION", "BAR", "VIHTI SKI CENTE",
    "MOTHER INDIA", "LAGER 157", "BURGER KING", "Messila Maailma", "NATURA VIVA", "Subway", "FINNKINO",
    "RESTORAN", "SHERLOCK HOLMES", "NOODLE STORY OY", "DONER", "Boneless", "POPLATEK", "UIMA", "IRONMAN",
    "EO SPACE OY", // School challenge RU
    "ZWIFT",
    "CYCLECLASSI", // rent bike
    "Cycle Classic", // rent bike
    "Rush", "Serena",
    "MCDONALDS",
    "KRISPY KEBAB",
    "STADIUM",
    "Aalto Group Oy", // Varuste.net
    "Helsingin kaupunki Pirkko", // Swimming pool
    "ROCKTHESPORT", // Marathon
    "Starcart", // watch brother
    "MCD", // MacDuck
    "RAMEN",
    "BAECKEREI", "BACKEREI",
    "RISTORANTE",
    "PIZZA",
    "PETERS PRALINCHEN",
    "KEBAB",
    "KEBAP",
    "PRALINENSHOP PETERS",
    "Lippstaedter Turnverein",
    "BACKHAUS LIENING",
    "SUEWOLTO BECKUMER",
    "CABRIOLI",
    "SOLBAD",
    "GOLD WOK",
    "Alpine",
    "DECATHLON",
    "TSAGHKADZOR ROPEWAY",
];
const CAR_TRANSPORT_SHOPS_SHORT_NAMES = ["NESTE", "HSL", "HELPPOKATSASTUS", "PARKMAN", "Parking", "TANKSTELLE",
    "AIMO PARK", "Teboil", "SHELL", "LansiAuto", "ODNO KOLESO", "TANKSTATION", "Aral Station", "TRAFICOM", "SHELL",
    "LIPPUAUTOMAATIT", "Motonet", "AMZN Mktp US*HY5EI2EQ0",
    "HELSINKI/KYMP/PYSÄKÖINTI", // paring fine
    "AUTOBAHN TANK", "PETROL",
    "TAXI", "EASYPARK", "BOLT",
    "VOBA BECKUM-LIPPSTADT",
    "JORMA AULIS HALON", // bought skoda
    "METRO", "UBER",
    "TOTAL SERVICE STATION",
    "STAR",
    "ESSO STATION", // petrol station
    "PARKSERVICE",
    "A.T.U.",
    "fair parken GmbH"
];
const TRAVEL_NAMES = ["VIKING LINE", "Tallink", "FINNLADY", "FINNLINES", "Hotel", "BOLT", "PAYTRAIL",
    "DIRECTF", "MOTEL", "RENT A CAR", "RAILW", "CORENDONAIRLINES", "FINNAIR", "SAMUEL LINDBLOM",
    "Milano Portello", 
    "Trustly Group AB", // finnair
    "Scandic Skarholmen FO", "SCANDLINES DEUTSCHLAND GM", "CINDERELLA",
    "VASAMUSEET", "VISIT VADSTENA",
    "OERESUNDSBROEN", // Denmark-Sweden bridge
    "BBR ORGANIZASYON REKLAM", "ALANYA TELEFERIK", "ANTALYA", "ISTANBUL", "ALANYA",
    "BOOKING",
    "Ilia Tumkin", // travel (for parents) or money for Russia
    "LUFTHANSA",
    "LuxExpress", "BALTICSHUTTLE", "ECOLINES", // buses to Russia
    "VIKINGLINE", "ECKERO LINE", "DIRECT FERR", // ferries to Tallinn
    "AIRBNB",
    "DBVERTRIEBG A", "DB Vertrieb", // Deutsche Bahn
    "WIZZ AIR",
    "AIRBALTIC",
    "elron", // Estonian train
    "KALEVSPA",
    "GKD GLOBAL FZE LLC", // Russian e-visa
    "RUSTRAVEL",
    "HOSTAL",
    "VISA ZW RENOMA SP ZOO", // Gdansk transport
    "MUZEUM",
    "WIZZAIR",
    "FLIXBUS",
    "BVG",
    "FlixTrain",
    "FLUGLADEN",
    "Holiday Inn",
    "Museum",
];
const HEALTH_NAMES = ["TERVEYSTALO MYYRMAKI", "Specsavers", "Malminkartanon apteekki", "CENTR KORREKCII ZRENIYA",
    "APTEKA", "SILMAASEMA", "HUS", "APOTHEKE", "ELAINSAIRAALA", "Apteekki", "Myyrmannin apt", "Fysio Sakura",
    "apteek", "FARMACIA", "MISTER SPEX" // contact lenses
];
const INSURANCE_NAMES = ["POHJOLA VAKUUTUS OY", "IF VAKUUTUS"];
const INVEST_NAMES = ["Interactive Brokers", "Bitstamp"];

type TransactionDetails = { amount: number, shop: string, date: Date };

export class TransactionAnalyzer {

    /**
     * UI-friendly entrypoint: pass CSV file content and (optionally) the bank format.
     * Returns the computed analysis object (no filesystem writes).
     */
    async analyzeCsvContent(fileContent: string, bankName: 'Nordea' | 'ING' = 'Nordea') {
        const transactions = await this.parseTransactionFiles(fileContent, bankName);
        return this.analyze(transactions);
    }

    async parseTransactionFiles(fileContent: string, bankName?: string): Promise<Transaction[]> {
        let headers: string[];
        if (bankName === 'Nordea') {
            headers = ['bookingDate', 'amount', 'sender', 'recipient', 'name', 'title', 'message', 'referenceNumber', 'balance', 'currency', 'empty'];
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
                'W�hrung'];
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
        return row.some((c) => c.toLowerCase().includes("booking date") || c.toLowerCase().includes("wertstellungsdatum"));
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
            referenceNumber: rec.referenceNumber ?? "",
            balance: rec.balance ?? "",
            currency: rec.currency ?? "",
        };
    }

    analyze(transactions: Transaction[]): {averageMonthExpenses: string, monthlyExpenses: any[]} {
        const monthExpenses = new Map<string, Expenses>();
        let foodTransactions: TransactionDetails[] = [];
        let houseAndFurnitureTransactions: TransactionDetails[] = [];
        let carAndTransportTransactions: TransactionDetails[] = [];
        let kidsTransactions: TransactionDetails[] = [];
        let insuranceTransactions: TransactionDetails[] = [];
        let travelTransactions: TransactionDetails[] = [];
        let sportsEatFunTransactions: TransactionDetails[] = [];
        let healthTransactions: TransactionDetails[] = [];
        let investTransactions: TransactionDetails[] = [];
        let otherTransactions: TransactionDetails[] = [];
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
            const transactionDetails: TransactionDetails = {amount: Math.abs(amountCents), shop, date};
            if (this.matchShop(shop, FOOD_SHOPS_SHORT_NAMES)) {
                updateExpenses.food = (expenses ? expenses.food : 0) + amountCents;
                foodTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, HOUSE_SHOPS_SHORT_NAMES)) {
                updateExpenses.houseAndFurniture = (expenses ? expenses.houseAndFurniture : 0) + amountCents;
                houseAndFurnitureTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                updateExpenses.carAndTransport = (expenses ? expenses.carAndTransport : 0) + amountCents;
                carAndTransportTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, KIDS_FAMILY_NAMES)) {
                updateExpenses.kids = (expenses ? expenses.kids : 0) + amountCents;
                kidsTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, INSURANCE_NAMES)) {
                updateExpenses.insurance = (expenses ? expenses.insurance : 0) + amountCents;
                insuranceTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, TRAVEL_NAMES)) {
                updateExpenses.travel = (expenses ? expenses.travel : 0) + amountCents;
                travelTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, SPORT_FOOD_FUN_NAMES)) {
                updateExpenses.sportEatFun = (expenses ? expenses.sportEatFun : 0) + amountCents;
                sportsEatFunTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, HEALTH_NAMES)) {
                updateExpenses.health = (expenses ? expenses.health : 0) + amountCents;
                healthTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, INVEST_NAMES)) {
                updateExpenses.invest = (expenses ? expenses.invest : 0) + amountCents;
                investTransactions.push(transactionDetails);
            } else {
                updateExpenses.other = (expenses ? expenses.other : 0) + amountCents;
                otherTransactions.push(transactionDetails);
            }
            monthExpenses.set(month, updateExpenses);
            const sum = updateExpenses.food + updateExpenses.houseAndFurniture + updateExpenses.carAndTransport
                + updateExpenses.kids + updateExpenses.insurance + updateExpenses.travel + updateExpenses.sportEatFun
                + updateExpenses.health + updateExpenses.invest + updateExpenses.other;
            if (updateExpenses.sum != sum) {
                console.error("Sum is wrong");
                throw new Error("Sum is wrong");
            }
        }

        return this.analyzeMonthlyExpenses(monthExpenses, foodTransactions, houseAndFurnitureTransactions,
            carAndTransportTransactions, kidsTransactions, insuranceTransactions, travelTransactions,
            sportsEatFunTransactions, healthTransactions, investTransactions, otherTransactions);
    }

    private getMonth(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    }

    private analyzeMonthlyExpenses(monthExpenses: Map<any, Expenses>,
                                   foodTransactions: TransactionDetails[],
                                   houseAndFurnitureTransactions: TransactionDetails[],
                                   carAndTransportTransactions: TransactionDetails[],
                                   kidsTransactions: TransactionDetails[],
                                   insuranceTransactions: TransactionDetails[],
                                   travelTransactions: TransactionDetails[],
                                   sportsEatFunTransactions: TransactionDetails[],
                                   healthTransactions: TransactionDetails[],
                                   investTransactions: TransactionDetails[],
                                   otherTransactions: TransactionDetails[]): {averageMonthExpenses: string, monthlyExpenses: any[]} {
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
                        transactions: this.transactionsToJson(foodTransactions, month)
                    },
                    houseAndFurniture: {
                        amount: this.centsToFloatEuros(houseAndFurnitureAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(houseAndFurnitureAmount, monthSumma),
                        transactions: this.transactionsToJson(houseAndFurnitureTransactions, month)
                    },
                    carAndTransport: {
                        amount: this.centsToFloatEuros(carAndTransportAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(carAndTransportAmount, monthSumma),
                        transactions: this.transactionsToJson(carAndTransportTransactions, month)
                    },
                    kids: {
                        amount: this.centsToFloatEuros(kidsAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(kidsAmount, monthSumma),
                        transactions: this.transactionsToJson(kidsTransactions, month)
                    },
                    insurance: {
                        amount: this.centsToFloatEuros(insuranceAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(insuranceAmount, monthSumma),
                        transactions: this.transactionsToJson(insuranceTransactions, month)
                    },
                    travel: {
                        amount: this.centsToFloatEuros(travelAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(travelAmount, monthSumma),
                        transactions: this.transactionsToJson(travelTransactions, month)
                    },
                    sportEatFun: {
                        amount: this.centsToFloatEuros(sportEatFunAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(sportEatFunAmount, monthSumma),
                        transactions: this.transactionsToJson(sportsEatFunTransactions, month)
                    },
                    health: {
                        amount: this.centsToFloatEuros(healthAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(healthAmount, monthSumma),
                        transactions: this.transactionsToJson(healthTransactions, month)
                    },
                    invest: {
                        amount: this.centsToFloatEuros(investAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(investAmount, monthSumma),
                        transactions: this.transactionsToJson(investTransactions, month)
                    },
                    other: {
                        amount: this.centsToFloatEuros(otherAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(otherAmount, monthSumma),
                        transactions: this.transactionsToJson(otherTransactions, month)
                    }
                }
            });
        }

        const monthCount = monthExpenses.size;
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
