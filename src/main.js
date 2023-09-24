const getLinks = require('./getLinks');
const getData = require('./getData');
const urlAlvo = 'https://www.minhacooper.com.br/loja/a.verde-bnu/produto/busca?q=cerveja';


async function main(url){
    //Pega a lista de links bruta
    const links = await getLinks(url);

    //Faz um for pra separar os link um por um
    for(let i = 0; i < links.length; i++){
        const url = links[i];
        await getData(url);

    }
};

main(urlAlvo)
