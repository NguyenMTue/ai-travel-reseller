import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium,expect as baseExpect} from "@playwright/test";
const expect=baseExpect.configure({timeout:60000}),base=process.env.MEDIA_LIBRARY_BASE_URL??"http://127.0.0.1:3192",out=process.env.MEDIA_LIBRARY_EVIDENCE_DIR??"build/fe-w3-media-evidence";
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH}:{})});
try{
  const ctx=await browser.newContext({serviceWorkers:"block",reducedMotion:"reduce"});const forbidden=[],errors=[];
  await ctx.route("**/*",route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===base&&url.pathname==="/fixture-missing-thumbnail.jpg")return route.abort();
    if(url.origin!==base||req.method()!=="GET"||/^\/(api|r)(\/|$)/.test(url.pathname)){forbidden.push(req.method()+" "+url.origin+url.pathname);return route.abort();}
    return route.continue();
  });
  const page=await ctx.newPage();page.setDefaultNavigationTimeout(180000);page.on("pageerror",e=>errors.push(e.message));
  async function shot(name){await page.addStyleTag({content:"nextjs-portal{display:none!important}"});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/${name}.png`,fullPage:true});await page.screenshot({path:`${out}/${name}-viewport.png`});}
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});await page.goto(`${base}/preview/merchant/library`,{waitUntil:"domcontentloaded"});
    await expect(page.getByRole("article")).toHaveCount(6);
    await expect(page.getByRole("img",{name:"Không có ảnh xem trước"})).toHaveCount(2);
    await expect.poll(()=>page.getByRole("article").locator("img").evaluateAll(images=>images.length===4&&images.every(img=>img.naturalWidth>0))).toBe(true);
    const normalCardWidth=await page.getByRole("article").first().evaluate(el=>el.getBoundingClientRect().width);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`document overflow ${width}`);
    assert(await page.getByRole("article").evaluateAll(cards=>cards.every(card=>{const c=card.getBoundingClientRect(),b=card.querySelector("button").getBoundingClientRect();return b.right<=c.right+1&&b.left>=c.left-1&&card.scrollWidth<=card.clientWidth+2;})),`card clip ${width}`);
    await page.getByRole("button",{name:"Chọn mẫu",exact:true}).first().click();await expect(page.getByRole("button",{name:"Đã chọn",exact:true})).toHaveAttribute("aria-pressed","true");await expect(page.getByText("Chỉ đánh dấu trong phiên này để tạo video AI từ mẫu.",{exact:true})).toBeVisible();
    assert(await page.getByText("Chỉ đánh dấu trong phiên này để tạo video AI từ mẫu.",{exact:true}).evaluate(el=>el.getBoundingClientRect().width>100),`selection text must retain readable width ${width}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`selected document overflow ${width}`);
    const generate=page.getByRole("button",{name:"Tạo video từ mẫu đã chọn",exact:true});
    assert(await generate.evaluate(button=>{const card=button.closest("section").getBoundingClientRect(),rect=button.getBoundingClientRect();return rect.left>=card.left&&rect.right<=card.right;}),`generation action must stay inside selection ${width}`);
    await page.getByRole("button",{name:"Bỏ chọn mẫu"}).click();
    await shot(`media-${width}`);
    const opener=page.getByRole("button",{name:"Quy chuẩn video",exact:true});await opener.click();const modal=page.getByRole("dialog",{name:"Quy chuẩn video du lịch"});
    await expect(modal).toBeVisible();await expect(page.getByRole("button",{name:"Đóng hướng dẫn quy chuẩn video"})).toBeFocused();
    for(let i=0;i<6;i++){await page.keyboard.press("Tab");assert(!await opener.evaluate(el=>el===document.activeElement));}
    for(let i=0;i<6;i++){await page.keyboard.press("Shift+Tab");assert(!await opener.evaluate(el=>el===document.activeElement));}
    await page.screenshot({path:`${out}/modal-${width}.png`});await page.keyboard.press("Escape");await expect(modal).not.toBeVisible();await expect(opener).toBeFocused();
    await page.getByRole("button",{name:"Sau",exact:true}).click();await expect(page.getByRole("article")).toHaveCount(2);await expect(page.getByText("Trang 2 / 2",{exact:true})).toBeVisible();
    assert(await page.getByRole("article").evaluateAll((cards,maxWidth)=>cards.every(card=>card.getBoundingClientRect().width<=maxWidth+1),normalCardWidth),`two results must not stretch ${width}`);
    await expect(page.getByRole("button",{name:"Sau",exact:true})).toBeDisabled();
    const search=page.getByRole("searchbox",{name:"Tìm theo tiêu đề"});await search.fill("Hội An");await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await expect(page.getByRole("article")).toHaveCount(1);await expect(page.getByRole("article").first()).toContainText("Hội An");
    const single=await page.getByRole("article").first().evaluate(card=>{const r=card.getBoundingClientRect(),image=card.firstElementChild.getBoundingClientRect();return {width:r.width,imageWidth:image.width,imageHeight:image.height};});
    assert(single.width<=normalCardWidth+1,`single result must retain normal card width ${width}`);
    assert(Math.abs(single.imageWidth/single.imageHeight-9/16)<0.001,`portrait ratio must remain 9:16 ${width}`);
    if(width>=768)assert(single.width<=360,`desktop/tablet card remains compact ${width}`);
    await shot(`single-${width}`);
    await search.fill("khong-co-mau-fixture");await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await expect(page.getByRole("article")).toHaveCount(0);await expect(page.getByRole("heading",{name:"Chưa có mẫu phù hợp"})).toBeVisible();
    await page.getByRole("button",{name:"Xóa bộ lọc"}).click();await expect(page.getByRole("article")).toHaveCount(6);
    await page.getByRole("combobox",{name:"Nền tảng",exact:true}).selectOption("reels");await expect(page.getByRole("article")).toHaveCount(4);await page.getByRole("button",{name:"Xóa bộ lọc"}).click();await expect(page.getByRole("article")).toHaveCount(6);
  }
  await page.getByLabel("Tùy chọn mô phỏng thư viện").click();const scenario=page.getByRole("combobox",{name:"Trạng thái thư viện mô phỏng"});
  for(const [value,message] of [["empty","Thư viện chưa có media"],["loading","Đang tải thư viện…"],["error","Chưa thể tải thư viện"],["network","Chưa thể tải thư viện"],["malformed","Dữ liệu trả về chưa đúng định dạng."],["session","Cần xác minh lại phiên đăng nhập"],["forbidden","Chưa có quyền Merchant"]]){
    await scenario.selectOption(value);await expect(page.getByText(message,{exact:value!=="malformed"})).toBeVisible();await expect(page.getByRole("article")).toHaveCount(0);
    if(value==="error")await shot("media-error");
  }
  await scenario.selectOption("ready");await expect(page.getByRole("article")).toHaveCount(6);await page.getByRole("button",{name:"Chọn mẫu",exact:true}).first().click();await page.getByRole("button",{name:"Mô phỏng hết phiên"}).click();await expect(page.getByRole("heading",{name:"Cần xác minh lại phiên đăng nhập"})).toBeVisible();await expect(page.getByRole("article")).toHaveCount(0);await expect(page.getByRole("button",{name:"Đã chọn",exact:true})).toHaveCount(0);
  await scenario.selectOption("slow");await expect(page.getByText("Đang tải thư viện…",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Đổi ngữ cảnh mô phỏng"}).click();await expect(page.getByRole("article")).toHaveCount(6);await expect(page.getByRole("article").first()).toContainText("Hành trình B");await page.waitForTimeout(1700);await expect(page.getByRole("article").first()).toContainText("Hành trình B");await expect(page.getByRole("button",{name:"Đã chọn",exact:true})).toHaveCount(0);
  await scenario.selectOption("ready");await expect(page.getByRole("article")).toHaveCount(6);await page.getByLabel("Tùy chọn mô phỏng thư viện").click();await page.getByRole("link",{name:"Tổng quan",exact:true}).click();await expect(page.getByRole("navigation",{name:"Điều hướng Merchant"}).getByRole("link",{name:"Thư viện media"})).toHaveAttribute("href","/preview/merchant/library");
  await page.getByRole("link",{name:"Thư viện media",exact:true}).click();await expect(page.getByRole("article")).toHaveCount(6);
  await page.goto(`${base}/merchant/library`);await expect(page).toHaveURL(/\/login\?next=%2Fmerchant%2Flibrary/);
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);console.log("PASS media fixture 320/390/768/1440: mapping, search/page/filter, null/error/session, selection, late result, keyboard/modal/nav; no service requests");
}finally{await browser.close();}
