import * as fs from "node:fs";
import * as path from "node:path";

export default class FileUtils {

    static async readFile(fileName: string) {
        const csvFilePath = path.resolve(__dirname, '../transactionFiles/' + fileName + ".csv");
        return fs.readFileSync(csvFilePath, {encoding: 'utf-8'});
    }

    static async saveFile(fileName: string, content: string) {
        const path = "analyzeResults/analysis_" + fileName + ".json";
        fs.writeFile(path, content, function (err) {
            if (err) {
                console.log(err);
            }
            console.log("Analyzed file is saved to " + path);
        });
    }
}