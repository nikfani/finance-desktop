import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Years to import (2021-2024)
const IMPORT_YEARS = [2021, 2022, 2023, 2024];

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Normalize category names
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'Здоровье и красота': 'Здоровье и красота',
    'Питание': 'Питание',
    'Развлечение': 'Развлечение',
    'Транспорт': 'Транспорт',
    'Образование': 'Образование',
    'интернет и связь': 'Интернет и связь',
    'Интернет и связь': 'Интернет и связь',
    'Одежда': 'Одежда',
    'долги': 'Долги',
    'Долги': 'Долги',
    'свое дело, доп вложения': 'Доп. вложения',
    'Доп. Вложения': 'Доп. вложения',
    'Доп. вложения': 'Доп. вложения',
    'непредвиденное, ремонт': 'Непредвиденное',
    'Непредвиденное': 'Непредвиденное',
    'цифровые покупки': 'Цифровые покупки',
    'Цифровые покупки': 'Цифровые покупки',
    'ленивый жор': 'Чрезмерное потребление',
    'чрезмерное потребление': 'Чрезмерное потребление',
    'Чрезмерное потребление': 'Чрезмерное потребление',
    'Покупки в дом, для себя': 'Покупки в дом',
    'Покупки в дом': 'Покупки в дом',
    'Бизнес': 'Бизнес',
    'Фондовый рынок': 'Фондовый рынок',
    'Алименты': 'Алименты',
    'Девушка': 'Девушка',
    'ЖКХ': 'ЖКХ',
    'Бытовая химия': 'Бытовая химия',
    'Веркина квартира': 'Другое',
    'зарплата': 'Зарплата',
    'Зарплата': 'Зарплата',
    'подработка': 'Подработка',
    'Подработка': 'Подработка',
    'дивиденды и купоны': 'Дивиденды и купоны',
    'Дивиденды и купоны': 'Дивиденды и купоны',
    'ДОЛГИ': 'Другое',
    'Другое': 'Другое',
  };
  
  return categoryMap[category] || category;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'upload', 'Финансы.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        transactions: [], 
        message: 'Excel file not found' 
      });
    }

    const workbook = XLSX.readFile(filePath);
    const transactions: Transaction[] = [];
    let idCounter = 1;

    // Process Expenses sheet
    if (workbook.SheetNames.includes('Расходы')) {
      const expensesSheet = workbook.Sheets['Расходы'];
      const expensesData = XLSX.utils.sheet_to_json(expensesSheet, { header: 1 }) as unknown[][];
      
      // Find the header row (Дата, Категория, Сумма, Описание)
      let headerRowIndex = -1;
      for (let i = 0; i < expensesData.length; i++) {
        const row = expensesData[i];
        if (row && row[0] === 'Дата' && row[1] === 'Категория') {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex >= 0) {
        for (let i = headerRowIndex + 1; i < expensesData.length; i++) {
          const row = expensesData[i];
          if (row && row.length >= 3 && typeof row[0] === 'number' && typeof row[2] === 'number') {
            const dateSerial = row[0] as number;
            const category = String(row[1] || '').trim();
            const amount = Math.abs(Number(row[2]));
            const description = String(row[3] || '').trim();

            if (category && amount > 0) {
              const date = excelDateToJSDate(dateSerial);
              const year = date.getFullYear();
              
              // Only import transactions from years 2021-2024
              if (IMPORT_YEARS.includes(year)) {
                transactions.push({
                  id: `import-exp-${idCounter++}`,
                  type: 'expense',
                  category: normalizeCategory(category),
                  amount,
                  date: date.toISOString().split('T')[0],
                  description,
                });
              }
            }
          }
        }
      }
    }

    // Process Income sheet
    if (workbook.SheetNames.includes('Доходы')) {
      const incomeSheet = workbook.Sheets['Доходы'];
      const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 }) as unknown[][];
      
      // Find the header row
      let headerRowIndex = -1;
      for (let i = 0; i < incomeData.length; i++) {
        const row = incomeData[i];
        if (row && row[0] === 'Дата' && row[1] === 'Категория') {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex >= 0) {
        for (let i = headerRowIndex + 1; i < incomeData.length; i++) {
          const row = incomeData[i];
          if (row && row.length >= 3 && typeof row[0] === 'number' && typeof row[2] === 'number') {
            const dateSerial = row[0] as number;
            const category = String(row[1] || '').trim();
            const amount = Math.abs(Number(row[2]));
            const description = String(row[3] || '').trim();

            if (category && amount > 0) {
              const date = excelDateToJSDate(dateSerial);
              const year = date.getFullYear();
              
              // Only import transactions from years 2021-2024
              if (IMPORT_YEARS.includes(year)) {
                transactions.push({
                  id: `import-inc-${idCounter++}`,
                  type: 'income',
                  category: normalizeCategory(category),
                  amount,
                  date: date.toISOString().split('T')[0],
                  description,
                });
              }
            }
          }
        }
      }
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get years statistics
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort();

    return NextResponse.json({ 
      transactions,
      count: transactions.length,
      years,
      message: 'Data imported successfully'
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      transactions: [], 
      message: 'Error importing data',
      error: String(error)
    }, { status: 500 });
  }
}
