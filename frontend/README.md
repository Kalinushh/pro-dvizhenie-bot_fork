# pro-dvizhenie-bot

Чтобы получить **динамическую отрисовку анкеты**, необходимо локально запустить сервер и перейти на:

```
http://localhost:5173/application
```

---

## Установка и запуск проекта

### 1. Клонирование репозитория

```bash
git clone git@github.com:pro-dvizhenie-life/pro-dvizhenie-bot.git
cd pro-dvizhenie-bot
```

---

### 2. Запуск бэкенда (Windows)

- Переходим в бекенд
```bash
cd backend
```

- Создаем виртуальное окружение
```bash
python -m venv venv
```

- Активируем его
```bash
venv\Scripts\activate
```

- Установка зависимостей
```bash
pip install -r requirements.txt
```

- Применяем миграции
```bash
python manage.py migrate
```

- Запускаем сервер и не закрываем
```bash
python manage.py runserver
```

Бэкенд будет доступен по адресу:
```
http://127.0.0.1:8000/
```

---

### 3. Запуск фронтенда

```bash
cd frontend
npm install
npm run dev
```

Фронтенд будет доступен по адресу:
```
http://localhost:5173
```

Анкета доступна по адресу:
```
http://localhost:5173/application
```

---

## Демонстрация

Ниже представлен пример работы анкеты при локальном запуске:

<p align="center">
  <img src="./frontend/docs/Запись-2025-11-06-144053.gif" alt="Демонстрация анкеты" width="900" />
</p>

---

## Проверка и форматирование кода 

### Проверка линтера и Prettier
bash
npm run check


### Форматирование файлов по Prettier
bash
npm run format


### Автоисправление (Lint + Prettier)
bash
npm run fix-all