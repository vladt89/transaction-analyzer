import {TransactionAnalyzer} from "../src";
import FileUtils from "../src/file-utils";


describe('Transaction analyzer', () => {
    const transactionAnalyzer = new TransactionAnalyzer();

    it.skip('should run the analyzer', async () => {
        const fileName = 'Nordea2025-dailyAccount';
        const fileContent = await FileUtils.readFile(fileName);
        const analysis = await transactionAnalyzer.analyzeCsvContent(fileContent);
        if (analysis) {
            await FileUtils.saveFile(fileName, JSON.stringify(analysis, null, 4));
        }
    })

    it('should verify all categories for 1 month', async () => {
        const fileContent =
            'Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;\n' +
            '2025/12/31;0,14;;FI57 **** 4294 14;;Interest - Capitalise;;;0,14;EUR;\n' +
            '2025/12/29;-120,68;FI57 **** 4294 14;FI6414****56058;TIKHOMIROV VLADIMIR;TIKHOMIROV VLADIMIR;;;0,00;EUR;\n' +
            '2025/12/23;-5500,00;FI57 **** 4294 14;DE545****816041429;Vladimir Tikhomirov;Vladimir Tikhomirov;;;120,68;EUR;\n' +
            '2025/12/19;-20,94;FI57 **** 4294 14;FI1880****0313360;Helen Oy;Helen Oy;202512032588975R1886;239566632306180239;0,34;EUR;\n' +
            '2025/12/19;21,00;;FI57 **** 4294 14;VLADIMIR TIKHOMIROV;VLADIMIR TIKHOMIROV;;;21,28;EUR;\n' +
            '2025/12/10;-49,70;FI57 **** 4294 14;;HPY*PDFZEN CO;HPY*PDFZEN CO;EUR          49,70 ETLondon;251208200416;0,28;EUR;\n' +
            '2025/12/09;-28,33;FI57 **** 4294 14;FI315****480750;Paytrail Oyj DNA Oyj Mobiilipa;Paytrail Oyj DNA Oyj Mobiilipa;;8858743773;49,98;EUR;\n' +
            '2025/12/09;-41,69;FI57 **** 4294 14;FI481******010189;ELISA OYJ;ELISA OYJ;;803671788000;78,31;EUR;\n' +
            '2025/12/08;-250,00;FI57 **** 4294 14;FI641*****56058;TIKHOMIROV VLADIMIR;TIKHOMIROV VLADIMIR;;;120,00;EUR;';

        const transactions = await transactionAnalyzer.parseTransactionFiles(fileContent, 'Nordea');
        // exercise
        const analyzeResult = transactionAnalyzer.analyze(transactions);
        expect(analyzeResult).toEqual({
            "averageMonthExpenses": "140.66 euros",
            "monthlyExpenses": [
                {
                    "categories": {
                        "carAndTransport": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "food": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "health": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "houseAndFurniture": {
                            "amount": 90.96,
                            "percentage": 64.67,
                            "transactions": {
                                "1": "spent 41.69 euros in ELISA OYJ on Tue Dec 09 2025",
                                "2": "spent 28.33 euros in Paytrail Oyj DNA Oyj Mobiilipa on Tue Dec 09 2025",
                                "3": "spent 20.94 euros in Helen Oy on Fri Dec 19 2025",
                                "on average": "spent 30.32 euros"
                            }
                        },
                        "insurance": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "invest": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "kids": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "other": {
                            "amount": 49.7,
                            "percentage": 35.33,
                            "transactions": {
                                "1": "spent 49.7 euros in HPY*PDFZEN CO 251208200416 on Wed Dec 10 2025",
                                "on average": "spent 49.7 euros"
                            }
                        },
                        "sportEatFun": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        },
                        "travel": {
                            "amount": 0,
                            "percentage": 0,
                            "transactions": {}
                        }
                    },
                    "month": "December 2025",
                    "sum": "140.66 euros"
                }
            ]
        });
    });

    it('should verify that the sum is correct for 1 month', async () => {
        const fileContent =
            'Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;\n' +
            // carAndTransport
            "2022/10/07;-50,00;FI57 **** 4294 14;;;NESTE EXPRESS HEL MALMIN;;EUR;;;\n" +
            "2022/10/07;-2,80;FI57 **** 4294 14;;;HSL Mobiili;;EUR;;;\n" +
            "2022/10/07;-2,80;FI57 **** 4294 14;;;HSL Mobiili;;EUR;;;\n" +
            // food
            "2022/10/11;-27,37;FI57 **** 4294 14;;;ALEPA MALMINKARTANO;;EUR;;;\n" +
            "2022/10/10;-5,27;FI57 **** 4294 14;;;ALEPA MALMINKARTANO;;EUR;;;\n" +
            "2022/10/10;-27,37;FI57 **** 4294 14;;;ALEPA MALMINKARTANO;;EUR;;;\n" +
            "2022/10/10;-10,96;FI57 **** 4294 14;;;K-supermarket Konala;;EUR;;;\n" +
            // houseAndFurniture
            "2022/10/05;-734,80;FI57 **** 4294 14;;;Asunto Oy Kuparikartano;;EUR;;;\n" +
            "2022/10/05;-173,00;FI57 **** 4294 14;;;TIKHOMIROV V TAI WEINER C;;EUR;;;\n" +
            "2022/10/05;-55,46;FI57 **** 4294 14;;;Helen Oy;;EUR;;;\n" +
            "2022/10/05;-55,46;FI57 **** 4294 14;;;Helen Oy;;EUR;;;\n" +
            // kids
            "2022/10/31;-265,94;FI57 **** 4294 14;;;Phoenix Partners Ky/LaughLearn;;EUR;;;\n" +
            // other
            "2022/10/10;-0,99;FI57 **** 4294 14;;;APPLE.COM/BILL;;EUR;;;\n" +
            "2022/10/10;-0,99;FI57 **** 4294 14;;;APPLE.COM/BILL;;EUR;;;\n" +
            "2022/10/10;-6,00;FI57 **** 4294 14;;;Espoon kaupunki;;EUR;;;\n" +
            "2022/10/10;-5,99;FI57 **** 4294 14;;;Motonet Helsinki, Konala;;EUR;;;\n" +
            // sportEatFun
            "2022/10/10;-10,10;FI57 **** 4294 14;;;VFI*Rami's Coffee Oy;;EUR;;;\n" +
            // travel
            "2022/10/10;-1189,68;FI57 **** 4294 14;;;FINNLINES OYJ;;EUR;;;";
        const transactions = await transactionAnalyzer.parseTransactionFiles(fileContent, 'Nordea');
        // exercise
        const analyzeResult = transactionAnalyzer.analyze(transactions);
        // verify
        expect(analyzeResult).toBeDefined();
        expect(analyzeResult.monthlyExpenses.length).toEqual(1);
        const categories = analyzeResult.monthlyExpenses[0].categories;
        const foodAmount = categories.food.amount;
        const houseAndFurnitureAmount = categories.houseAndFurniture.amount;
        const carAndTransportAmount = categories.carAndTransport.amount;
        const kidsAmount = categories.kids.amount;
        const travelAmount = categories.travel.amount;
        const sportEatFunAmount = categories.sportEatFun.amount;
        const otherAmount = categories.other.amount;

        const sum = foodAmount + houseAndFurnitureAmount + carAndTransportAmount + kidsAmount + travelAmount
            + sportEatFunAmount + otherAmount;
        expect(analyzeResult.monthlyExpenses[0].sum).toEqual(Math.round(sum * 100) / 100 + " euros");

        const foodPercentage = categories.food.percentage;
        const houseAndFurniturePercentage = categories.houseAndFurniture.percentage;
        const carAndTransportPercentage = categories.carAndTransport.percentage;
        const kidsPercentage = categories.kids.percentage;
        const travelPercentage = categories.travel.percentage;
        const sportEatFunPercentage = categories.sportEatFun.percentage;
        const otherPercentage = categories.other.percentage;
        expect(100).toEqual(Math.round(((foodPercentage + houseAndFurniturePercentage + carAndTransportPercentage
            + kidsPercentage + travelPercentage + sportEatFunPercentage + otherPercentage) * 100) / 100)
        );
    });

    it('should verify transformation from cents to float euros', function () {
        const centsToFloatEuros = transactionAnalyzer.centsToFloatEuros(2345);
        expect(centsToFloatEuros).toEqual(23.45);
    });
});
