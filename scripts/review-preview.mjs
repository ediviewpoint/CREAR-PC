import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '@playwright/test';
await fs.mkdir('output/review',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1243/chrome-win64/chrome.exe')});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce',colorScheme:'light'});
 await page.goto('http://localhost:3000/build',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Cargar equipo de prueba',exact:true}).click();
 const preview=page.getByRole('region',{name:'Vista conceptual de tu equipo',exact:true});
 await preview.screenshot({path:'output/review/vista-ensamblada.png'});
 await preview.getByRole('button',{name:'Por piezas',exact:true}).click();
 await preview.screenshot({path:'output/review/vista-por-piezas.png'});
 await page.emulateMedia({colorScheme:'dark'});
 await preview.screenshot({path:'output/review/vista-por-piezas-oscura.png'});
 await page.setViewportSize({width:320,height:1000});
 await preview.getByRole('button',{name:'Mostrar vista',exact:true}).click();
 await preview.screenshot({path:'output/review/vista-movil.png'});
 console.log('Cuatro capturas: ensamblada, por piezas, oscuro y móvil.');
}finally{await browser.close();}
