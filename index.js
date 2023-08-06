import express from "express";
import path from "path";
import crypto from "crypto";
import { v4 } from "uuid";
import "dotenv/config.js";
// const __dirname = path.dirname(new URL(import.meta.url).pathname);
const app = express();
const port = 8080;
const mid = process.env.mid; // 網路上找的，感謝大德
const key = process.env.key; // 網路上找的，感謝大德
const iv = process.env.iv; // 網路上找的，感謝大德
console.log(mid, key, iv);
app.set("view engine", "ejs");
app.use(express.json());
//藍新傳回來的格式是urlencode
app.use(express.urlencoded({ extended: false }));
app.post("/order-complete", function (req, res) {
  console.log("/order-complete", req.body);

  res.render("pages/order-complete");
});
app.get("/note", function (req, res) {
  console.log("get.note", req.body);
}); //這個沒用
app.post("/note", function (req, res) {
  console.log("post.note", req.body);
  res.status(200).end();
});
app.get("/:amount", function (req, res) {
  const { amount } = req.params;
  /* 

測試卡號：4000-2211-1111-1111
有效期限：輸入比今天大即可 
末三碼：任意填寫

*/

  const timeStamp = Date.now();
  const amt = parseInt(amount); //幣值，沒給的話預設是台幣
  const MerchantOrderNo = `jianshenbaolei${timeStamp}`; //有30字最大上限，限英文數字底線
  //將tradeinfo物件轉成像querystring的東西
  function genDataChain(TradeInfo) {
    let results = [];
    for (let kv of Object.entries(TradeInfo)) {
      results.push(`${kv[0]}=${kv[1]}`);
    }
    return results.join("&");
  }
  //定義 aes256 key iv加密方法
  let encrypt = crypto.createCipheriv("aes256", key, iv);
  //加密字串化的TradeInfo
  let enc = encrypt.update(
    genDataChain({
      MerchantID: mid,
      TimeStamp: timeStamp,
      Version: "2.0",
      RespondType: "String",
      MerchantOrderNo,
      Amt: amt,
      NotifyURL: "https://ce5b-111-240-210-116.ngrok-free.app/note", //直擊後端
      ReturnURL: "http://localhost:8080/order-complete", //直擊EJS畫面但是是用post方法
      ItemDesc: "交易詳細資訊", //交易詳細資訊
    }),
    "utf8",
    "hex"
  );

  //把key和iv也加密後加到剛剛字串化的加密字串化的TradeInfo
  enc += encrypt.final("hex");
  //定義雜湊方式
  let sha = crypto.createHash("sha256");
  //定義要雜湊化的內容
  let plainText = `HashKey=${key}&${enc}&HashIV=${iv}`;
  let hashs;
  //進行雜湊
  hashs = sha.update(plainText).digest("hex").toUpperCase();
  //前後端分離的話要讓react 拿到這些資訊 在隱藏表格內提出這些
  res.render("pages/index", {
    MerchantID: mid,
    MerchantOrderNo,
    TradeInfo: enc,
    TradeSha: hashs,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
