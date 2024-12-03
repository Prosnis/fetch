const express = require('express');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

const fetchProductWithPuppeteer = async (url) => {
  console.log('Запуск puppeteer для URL:', url);
  const browser = await puppeteer.launch({
    executablePath: await chrome.executablePath,
    args: chrome.args,
    headless: chrome.headless,
  });

  const page = await browser.newPage();
  console.log('Страница создана');
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.77 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
});

  try {
    console.log('Загрузка страницы...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'debug.png', fullPage: true });
    console.log('Страница загружена');

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
    console.log('Ошибка при парсинге:', error);
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

app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});
app.get('/', (req, res) => {
  res.send('Сервер работает!');
});
app.use((req, res, next) => {
  console.log(`Method: ${req.method}, URL: ${req.url}`);
  next();
})

