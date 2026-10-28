import fs from "node:fs/promises";
import path from "node:path";
import {chromium,expect} from "@playwright/test";
await fs.mkdir("output/review",{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:path.join(process.env.LOCALAPPDATA,"ms-playwright/chromium-1243/chrome-win64/chrome.exe")});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1300},colorScheme:"light"});
 await page.goto("http://localhost:3000/catalog",{waitUntil:"networkidle",timeout:60000});
 await page.screenshot({path:"output/review/catalogo-claro.png",animations:"disabled"});
 await page.emulateMedia({colorScheme:"dark"});
 await expect(page.locator("body")).toHaveCSS("background-color","rgb(5, 15, 36)");
 await page.screenshot({path:"output/review/catalogo-oscuro.png",animations:"disabled"});
 await page.emulateMedia({colorScheme:"light"});
 await page.setViewportSize({width:390,height:1200});
 await page.screenshot({path:"output/review/catalogo-movil.png",animations:"disabled"});
 console.log("Capturas: catálogo claro, oscuro y móvil.");
}finally{await browser.close();}
