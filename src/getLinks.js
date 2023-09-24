const puppeteer = require('puppeteer');


async function getLinks(url){
    //Configuração padão do Puppeteer que incializa ele.
    const browser = await puppeteer.launch(
        {
            headless: "new",
        defaultViewport: null,
        }
    );
    //Esperar o navegador abrir uma nova aba
    const page = await browser.newPage();
    
    //Vai para a página no formato HTML
    await page.goto(url);
    
    //Espera a barra de pesquisa aparecer
    await page.waitForXPath('//*[@id="input-search"]',{delay:100});

    //Escreve na barra de pesquisa
    await page.type('input[name="q"]', 'abacaxi',{delay:100});
    
    //Dá o enter pra pesquisar
    await page.keyboard.press('Enter',{delay:100});
    
    //Espera aparecer o botão na tela(waitForSelector)
    await page.waitForSelector('.button.button-default.ajax-pagination.see-more');

    //Clica no botão que apareceu na tela 
    await page.click('.button.button-default.ajax-pagination.see-more');
    
    //Espera a img que vai para o link carregar
    await page.waitForSelector('.product-variation__image-container');
    
    //Raspa todos os links dos produtos
    const lnkProdutos = await page.$$eval('.product-variation__image-container', prds => prds.map(prd => prd.href));
    
    //Tira um screeshot da pag inteira
    await page.screenshot({path:'./src/img/ScreeShot.png', fullPage: true});
    
    //console.log(lnkProdutos); 
    await browser.close();
    return lnkProdutos
}

module.exports = getLinks;
