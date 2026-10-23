import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";
const expect=baseExpect.configure({timeout:60000});
const base="http://127.0.0.1:3190", output="build/fe-w3-wallet-evidence";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH}:{})});
try {
  const context=await browser.newContext({serviceWorkers:"block",reducedMotion:"reduce"});
  const forbidden=[],errors=[];
  await context.route("**/*",route=>{
    const r=route.request(),u=new URL(r.url());
    if(u.origin!==base||r.method()!=="GET"||u.pathname.startsWith("/api/")||u.pathname.startsWith("/r/")){
      forbidden.push(`${r.method()} ${u.origin}${u.pathname}`);return route.abort();
    }
    return route.continue();
  });
  const page=await context.newPage();page.setDefaultNavigationTimeout(180000);
  page.on("pageerror",error=>errors.push(error.message));
  const scenario=page.getByRole("combobox",{name:"Trạng thái ví mô phỏng"});
  const quickNav=page.getByRole("navigation",{name:"Điều hướng nhanh Cộng tác viên",exact:true,includeHidden:true});
  const desktopNav=page.getByRole("navigation",{name:"Điều hướng Cộng tác viên",exact:true});
  async function shot(name){await page.addStyleTag({content:"nextjs-portal{display:none!important}"});await page.screenshot({path:`${output}/${name}.png`,fullPage:true});
    if(name.startsWith("wallet-"))await page.screenshot({path:`${output}/${name}-viewport.png`});}
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width>=768?1000:844});
    await page.goto(`${base}/preview/reseller/wallet`,{waitUntil:"domcontentloaded"});
    await expect(page.getByTestId("available-balance")).toHaveText("1.269.000 ₫");
    await expect(page.getByTestId("lifetime-earnings")).toHaveText("4.269.000 ₫");
    await expect(page.getByLabel("Số lần đọc ví mô phỏng")).toHaveText("1");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
    const nav=width<768?quickNav:desktopNav;
    await expect(nav.getByRole("link",{name:/Ví hoa hồng/})).toHaveAttribute("aria-current","page");
    await expect(nav.getByRole("link",{name:/Ví hoa hồng/})).toHaveAttribute("href","/preview/reseller/wallet");
    await expect(nav.getByRole("link",{name:/Khám phá|Chiến dịch/})).not.toHaveAttribute("aria-current","page");
    await nav.getByRole("link",{name:/Ví hoa hồng/}).focus();
    assert.equal(await nav.getByRole("link",{name:/Ví hoa hồng/}).evaluate(el=>getComputedStyle(el).outlineStyle),"solid");
    if(width<768){
      for(const a of await quickNav.locator('a,button').all()){const box=await a.boundingBox();assert.ok(box.width>=44&&box.height>=44);}
      await page.locator("footer").scrollIntoViewIfNeeded();
      const footer=await page.locator("footer").boundingBox(),dock=await quickNav.boundingBox();assert.ok(footer.y+footer.height<=dock.y+1);
      await page.evaluate(()=>window.scrollTo(0,0));
    }
    await shot(`wallet-${width}`);
    await page.getByLabel("Tùy chọn mô phỏng ví").click();
    await scenario.selectOption("long");
    await expect(page.getByTestId("lifetime-earnings")).toHaveText("9.007.199.254.740.991 ₫");
    await expect(page.getByText("Chưa xác định",{exact:true})).toBeVisible();
    await expect(page.getByText("Chưa có mã đặt chỗ",{exact:true})).toBeVisible();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`long overflow ${width}`);
    await shot(`long-${width}`);
    console.log(`PASS ${width}: VND/long content, navigation active state, focus, touch targets and footer clearance`);
  }
  await page.setViewportSize({width:390,height:844});
  for(const [state,title] of [["loading","Đang tải ví hoa hồng"],["error","Chưa thể tải ví hoa hồng"],["malformed","Chưa thể tải ví hoa hồng"],["session","Cần xác minh lại phiên đăng nhập"],["forbidden","Chưa có quyền đọc ví hoa hồng"]]){
    await scenario.selectOption(state);
    if(state==="loading")await expect(page.getByRole("region",{name:title})).toBeVisible();
    else await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    await expect(page.getByTestId("available-balance")).toHaveCount(0);
    await shot(`state-${state}`);
  }
  await scenario.selectOption("zero");await expect(page.getByTestId("available-balance")).toHaveText("0 ₫");
  await expect(page.getByRole("heading",{name:"Chưa có giao dịch hoa hồng"})).toBeVisible();await shot("zero-390");
  await scenario.selectOption("empty-history");await expect(page.getByTestId("available-balance")).toHaveText("1.269.000 ₫");
  await expect(page.getByRole("heading",{name:"Chưa có giao dịch hoa hồng"})).toBeVisible();
  await page.getByRole("button",{name:"Mô phỏng đăng xuất"}).click();
  await expect(page.getByTestId("available-balance")).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Cần xác minh lại phiên đăng nhập"})).toBeVisible();
  await scenario.selectOption("slow");await expect(page.getByRole("status").filter({hasText:"Đang xác minh phiên"})).toBeVisible();
  await page.getByRole("button",{name:"Đổi tài khoản mô phỏng"}).click();
  await expect(page.getByTestId("available-balance")).toHaveCount(0);
  await expect(page.getByTestId("available-balance")).toHaveText("216.000 ₫");
  await expect(page.getByTestId("lifetime-earnings")).toHaveText("3.216.000 ₫");
  await expect(page.getByText("Dữ liệu mô phỏng tài khoản B",{exact:true})).toBeVisible();
  console.log("PASS loading/error/schema/expired/forbidden vs zero/empty; session switch drops stale response");
  await scenario.selectOption("ready");await expect(page.getByTestId("available-balance")).toHaveText("216.000 ₫");
  const before=Number(await page.getByLabel("Số lần đọc ví mô phỏng").textContent());
  await page.getByRole("button",{name:"Tải lại ví",exact:true}).click();
  await expect(page.getByLabel("Số lần đọc ví mô phỏng")).toHaveText(String(before+1));
  await expect(page.getByTestId("available-balance")).toHaveText("216.000 ₫");
  await page.getByRole("button",{name:"Mô phỏng đăng xuất"}).click();
  await quickNav.getByRole("link",{name:/Khám phá/}).click();
  await expect(page.getByRole("heading",{name:"Chiến dịch dành cho bạn"})).toBeVisible();
  await quickNav.getByRole("link",{name:/Ví hoa hồng/}).click();
  await expect(page.getByTestId("available-balance")).toHaveText("1.269.000 ₫");
  await expect(quickNav.getByRole("link",{name:/Ví hoa hồng/})).toHaveAttribute("aria-current","page");
  // No session in this browser. The real portal must remain protected, never show fixture balances.
  await page.goto(`${base}/reseller/wallet`);
  await expect(page).toHaveURL(/\/login\?next=%2Freseller%2Fwallet/);
  await expect(page.getByTestId("available-balance")).toHaveCount(0);
  assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);
  console.log("PASS manual refresh, feed-to-wallet navigation, portal guard; no API/write/external requests");
  await context.close();
} finally {await browser.close();}
