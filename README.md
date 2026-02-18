# Финансы - Desktop Application

Персональное приложение для учета финансов с импортом данных из Excel.

## Функции

- 📊 Дашборд с обзором финансов
- 💰 Управление транзакциями
- 🎯 Лимиты бюджета по категориям
- 🔍 Поиск и фильтрация
- 📥 Импорт из Excel
- 👤 Многопользовательский режим

## Технологии

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Zustand (state management)
- Electron (macOS desktop)

## Установка

```bash
# Установить зависимости
npm install

# Установить зависимости Electron
cd desktop && npm install && cd ..

# Запуск для разработки
npm run dev
```

## Сборка desktop версии

```bash
# Сборка Next.js
npm run build

# Сборка Electron (macOS ARM64)
cd desktop && npm run dist:mac
```

Готовый файл: `desktop/dist/Финансы-1.0.0-arm64.dmg`

## Использование

1. Создайте аккаунт (минимум 3 символа имя, 4 символа пароль)
2. Добавьте категории в Настройках
3. Добавляйте транзакции
4. Импортируйте данные из Excel: Настройки → Данные → Импортировать

### Формат Excel файла

- Лист "Расходы": Дата | Категория | Сумма | Описание
- Лист "Доходы": Дата | Категория | Сумма | Описание

## Структура

```
finance-desktop/
├── src/                    # Next.js приложение
│   ├── app/               # Страницы и API
│   ├── components/        # React компоненты
│   └── store/             # Zustand store
├── desktop/               # Electron
│   ├── electron/          # Main process
│   └── package.json       # Конфигурация
├── assets/                # Иконки
└── public/                # Статические файлы
```

## Автор

Nik

## Лицензия

MIT
