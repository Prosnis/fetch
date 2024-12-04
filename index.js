const express = require('express');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Настраиваем CORS
const corsOptions = {
  origin: ['http://localhost:5173'], // Укажите источник вашего клиента
  methods: ['GET', 'POST'],         // Разрешённые методы
  allowedHeaders: ['Content-Type'], // Разрешённые заголовки
  credentials: true                 // Если нужны cookies
};
app.use(cors(corsOptions));

// Обработка preflight-запросов
app.options('/fetch-product', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

const fetchProductWithPuppeteer = async (url) => {
  const browser = await puppeteer.launch({
    executablePath: await chrome.executablePath,
    args: chrome.args,
    headless: chrome.headless,
  });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.77 Safari/537.36');

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
});

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.screenshot({ path: 'debug.png', fullPage: true });

    // Парсим данные о товаре
    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('[data-additional-zone="title"]')?.innerText || 'Название не найдено',
        image: document.querySelector('img._1WAh0')?.src || 'Изображение не найдено',
        description: document.querySelector('[aria-label="product-description"]')?.innerText || 'Описание не найдено',
      };
    });

    console.log('Товар:', data);
    await browser.close();
    return data;
  } catch (error) {
    console.error('Ошибка при парсинге:', error.message);
    await browser.close();
    throw error;
  }
};

app.post('/fetch-product', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send('URL товара обязателен');
  }

  try {
    const productData = await fetchProductWithPuppeteer(url);
    res.json(productData);
  } catch (error) {
    res.status(500).send('Ошибка при получении данных о товаре');
  }
});

app.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET,POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.sendStatus(204);
});

app.use(cors())
app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});


