const express = require('express');
const cors = require('cors');
const storage = require('node-persist');

const app = express();
app.use(cors());
app.use(express.json());

var stock_codes = {}
var changed = false
app.get('/', (req, res) => {
    fetchStockCode("hindustan-aeronautics-ltd")
    res.send('Hello, world!');
});

app.post("/stockPrices", async (req, res) => {
    let data = req.body
    let prices = await fetchStockPrices(data)
    return res.json(prices)
})

app.get("/mfHoldings", async (req, res) => {
    let mf = req.query.name
    let fr = await fetch('https://groww.in/v1/api/data/mf/web/v4/scheme/search/' + mf);
    let tres = await (fr).json();
    return res.json({nav:tres["nav"], nav_date:tres["nav_date"], holdings:tres["holdings"] })
})

app.get("/search", async (req, res) => {
    
    let mf = req.query.name
    let fr = await fetch(`https://groww.in/v1/api/search/v3/query/global/st_query?entity_type=scheme&from=0&query=${mf}&size=5`);
    let tres = await (fr).json();
    return res.json(tres)
})

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


(async () => {
    await storage.initSync();
    stock_codes = await storage.getItem('codes');
    if (!stock_codes) {
        stock_codes = {}
        saveCodes()
    }
})()

async function saveCodes() {
    await storage.setItem('codes', stock_codes);
}

setInterval(() => {
    if (changed) {
        saveCodes()
        changed = false
    }
}, 1000*60)

async function fetchStockCode(id) {
    let nse = stock_codes[id];
    if (nse) {
        return nse
    }
    try {
        let fr = await fetch(`https://groww.in/v1/api/stocks_data/v1/company/search_id/${id}`);
        let header = (await (fr).json())["header"]
        let retj;
        if (header["nseScriptCode"]) {
            retj = header["nseScriptCode"]

            stock_codes[id] = header["nseScriptCode"]
        }
        else if (header["bseScriptCode"]) {
            retj = header["bseScriptCode"]

            stock_codes[id] = header["bseScriptCode"]
        }
        changed = true
        return retj

    } catch (e) {
        console.log(e)
        return undefined
    }
}

async function fetchStockPrices(code_list) {
    let map = {}
    let nse = []
    let bse = []
    var startTime = performance.now()
    var codes = await Promise.all(code_list.map(code => fetchStockCode(code)))
    for (let i in code_list) {

        let code = code_list[i]
        let retj = codes[i]
        if (!retj) {
            continue
        }
        else if (isNaN(retj)) {
            nse.push(retj)
            map[retj] = code
        }
        else {
            bse.push(retj)
            map[retj] = code
        }

    }
    var endTime = performance.now()
    console.log(`Call to fetchStockCode took ${endTime - startTime} milliseconds`)
    startTime = performance.now()
    let groww_agg = "https://groww.in/v1/api/stocks_data/v1/tr_live/segment/CASH/latest_aggregated"
    let reqBody = {
        exchangeAggReqMap: {
            NSE: { priceSymbolList: nse, indexSymbolList: [] },
            BSE: { priceSymbolList: bse, indexSymbolList: [] }
        }
    }
    let tres = await (await fetch(groww_agg, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
    })).json();

    endTime = performance.now()

    console.log(`Call to fetch took ${endTime - startTime} milliseconds`)
    startTime = performance.now()
    let retx = {}
    let nse_keys = Object.keys(tres["exchangeAggRespMap"]["NSE"]["priceLivePointsMap"])
    let bse_keys = Object.keys(tres["exchangeAggRespMap"]["BSE"]["priceLivePointsMap"])
    
    //check time on either exchange
    if (nse_keys.length) {
        let time = tres["exchangeAggRespMap"]["NSE"]["priceLivePointsMap"][nse_keys[0]]["lastTradeTime"]
        retx["lastTradeTime"] = time * 1000
    } else if (bse_keys.length) {
        let time = tres["exchangeAggRespMap"]["BSE"]["priceLivePointsMap"][bse_keys[0]]["lastTradeTime"]
        retx["lastTradeTime"] = time * 1000
    }
    for (let key of nse_keys) {
        retx[map[key]] = tres["exchangeAggRespMap"]["NSE"]["priceLivePointsMap"][key]["dayChangePerc"]
    }
    for (let key of bse_keys) {
        retx[map[key]] = tres["exchangeAggRespMap"]["BSE"]["priceLivePointsMap"][key]["dayChangePerc"]
    }
    
    endTime = performance.now()

    console.log(`Call to reverseMap took ${endTime - startTime} milliseconds`)

    return retx
}
