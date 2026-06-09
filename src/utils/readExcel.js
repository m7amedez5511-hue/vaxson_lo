import xlsx from "xlsx";

export const readExcel = (filePath, sheetIndex = 0) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[sheetIndex];
    const sheet = workbook.Sheets[sheetName];

     return xlsx.utils.sheet_to_json(sheet, {
        defval: null, // prevent undefined
        raw: true,
        range: 1 // ⬅️ skip first row (description)
    });
};