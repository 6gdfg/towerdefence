import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { studyItemsFromJson } from '../src/study/studyData';

const options={skip:!process.env.TD_TEST_PLAYWRIGHT};
let browser:any;
before(async()=>{
  if(options.skip) return;
  const {chromium}=await import(pathToFileURL(process.env.TD_TEST_PLAYWRIGHT!).href);
  browser=await chromium.launch({headless:true,executablePath:process.env.TD_TEST_CHROMIUM});
});
after(async()=>{await browser?.close();});

test('daily practice resumes issued questions and retries the same 50 answers without invented scores',options,async()=>{
  const bank=studyItemsFromJson(JSON.parse(await readFile('public/study-data/words.json','utf8')));
  const items=bank.jsonWordItems.slice(0,50);
  const questions=items.map(item=>({itemId:item.id,options:[item.answer,...bank.phraseItems
    .filter(candidate=>candidate.answer!==item.answer).slice(0,3).map(candidate=>candidate.answer)]}));
  const runId='practice_00000000-0000-4000-8000-000000000000';
  const context=await browser.newContext({viewport:{width:1200,height:800}});
  const page=await context.newPage();
  const errors:string[]=[];
  const claims:any[]=[];
  const starts:any[]=[];
  page.on('pageerror',(error:Error)=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('td_token','practice-test');
    localStorage.setItem('td_player_id','practice-player');
    localStorage.setItem('td_username','practice-player');
  });
  await page.route('**/api/**',async(route:any)=>{
    const request=route.request();
    const body=request.method()==='POST' ? request.postDataJSON() : {};
    if(body.action==='startDailyPractice') {
      starts.push(body);
      return route.fulfill({json:{runId,questions}});
    }
    if(body.action==='completeDailyPractice') {
      claims.push(body);
      return route.fulfill({status:claims.length===1 ? 503 : 200,json:claims.length===1
        ? {error:'temporary practice settlement failure'} : {runReward:{coins:0,experience:10,diamonds:1}}});
    }
    return route.fulfill({json:{stars:{},coins:1000,diamonds:5,experience:0,chests:[],towerLevels:{},unlockedItems:['sunflower','bottleGrass']}});
  });
  try {
    await page.goto(`${process.env.TD_TEST_URL ?? 'http://127.0.0.1:5176'}/study`);
    await page.getByRole('button',{name:'每日 每日练习',exact:true}).click();
    assert.equal(starts.length,0);
    await page.getByRole('button',{name:'开始练习',exact:true}).click();
    for(let i=0;i<5;i++) {
      await page.locator('.study-option').first().click();
      await page.getByRole('button',{name:'下一题',exact:true}).click();
    }
    await page.reload();
    await page.getByRole('button',{name:'继续练习',exact:true}).click();
    await page.locator('.study-question-card h2').filter({hasText:items[5].prompt}).waitFor();
    assert.equal(starts.length,2);
    for(let i=5;i<50;i++) {
      await page.locator('.study-option').first().click();
      if(i<49) await page.getByRole('button',{name:'下一题',exact:true}).click();
    }
    await page.getByRole('alert').getByText('temporary practice settlement failure',{exact:true}).waitFor();
    await page.getByRole('button',{name:'重试结算',exact:true}).click();
    await page.getByRole('alert').waitFor({state:'detached'});
    assert.equal(claims.length,2);
    assert.deepEqual(claims[0],claims[1]);
    assert.equal(claims[0].runId,runId);
    assert.deepEqual(claims[0].answers,Array(50).fill(0));
    assert.equal(claims[0].correct,undefined);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});
