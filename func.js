const text = async () => {
    const url = 'https://web-production-0db5.up.railway.app/fetch-product'; // Замените на ваш реальный серверный URL
    const productUrl = 'https://market.yandex.ru/product--igrovaia-pristavka-400-igr/1828098498?sku=101979257903&uniqueId=54214844&do-waremd5=LGH6sT5K255bth_fff-Ahw'; // Замените на URL товара, который хотите передать

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: productUrl }), // Передаем URL товара в запросе
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json(); // Получаем данные из ответа
        console.log('Данные о товаре:', data);

        // Выводим результат на страницу
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
};

text()