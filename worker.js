// Nav-CF Worker - FINAL STABLE AI VERSION
// KV Binding: CARD_ORDER
// Env:
// - ADMIN_PASSWORD
// - AI_API_KEY (sk-xxxx placeholder supported)

import { SEED_DATA, SEED_USER_ID } from "./db.js";

function cleanDomain(hostname) {
  return hostname
    .replace(/^www\./, "")
    .replace(/^cn\./, "")
    .split(".")[0];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* ======================================================
       AI GENERATE — FIRST ROUTE, NO AUTH, OPENAI FIRST (STABLE)
       ====================================================== */
    if (url.pathname === "/api/aiGenerate") {
      let targetUrl = "";

      if (request.method === "POST") {
        try {
          const body = await request.json();
          targetUrl = body.url || "";
        } catch {}
      } else if (request.method === "GET") {
        targetUrl = url.searchParams.get("url") || "";
      }

      if (!targetUrl) {
        return Response.json({ name: "", desc: "", source: "none" });
      }

      const hostname = (() => {
        try { return new URL(targetUrl).hostname; }
        catch { return targetUrl; }
      })();

      const domain = cleanDomain(hostname);
      const aiKey = env.AI_API_KEY || "";
      const canUseAI = aiKey.startsWith("sk-") && !aiKey.includes("xxxx");

      /* ---------- OpenAI FIRST (temperature=0 for stability) ---------- */
      if (canUseAI) {
        try {
          const prompt = `你是一个中文网站导航编辑。
请根据网址生成导航信息：
- 名称：完整、自然，不要简称
- 描述：10~15字，概括主要用途

网址：${targetUrl}

仅返回 JSON：{"name":"","desc":""}`;

          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + aiKey
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.0
            })
          });

          const j = await r.json();
          const t = j.choices?.[0]?.message?.content;
          if (t) {
            const ai = JSON.parse(t);
            if (ai.name || ai.desc) {
              return Response.json({
                name: ai.name || domain.charAt(0).toUpperCase() + domain.slice(1),
                desc: ai.desc || "",
                source: "openai"
              });
            }
          }
        } catch {}
      }

      /* ---------- Worker SMART FALLBACK ---------- */
      let fallbackDesc = "官方网站入口";
      if (domain === "uptodown") fallbackDesc = "应用与软件下载平台";
      if (domain === "github") fallbackDesc = "开源代码托管平台";
      if (domain === "cloudflare") fallbackDesc = "网络与安全服务平台";
      if (domain === "google") fallbackDesc = "搜索与互联网服务";

      return Response.json({
        name: domain.charAt(0).toUpperCase() + domain.slice(1),
        desc: fallbackDesc,
        source: "fallback"
      });
    }

    /* ================= PAGE ================= */
    if (url.pathname === "/") {
      return new Response(HTML_CONTENT, {
        headers: { "content-type": "text/html; charset=UTF-8" }
      });
    }

    /* ================= API ================= */
    if (url.pathname === "/api/getLinks") {
      const data = await env.CARD_ORDER.get(SEED_USER_ID, "json") || SEED_DATA;
      return Response.json(data);
    }

    if (url.pathname === "/api/saveOrder") {
      let auth = request.headers.get("Authorization");
let body = {};
try { body = await request.json(); } catch {}
if (auth !== env.ADMIN_PASSWORD && body.password !== env.ADMIN_PASSWORD) {
  return new Response("Unauthorized", { status: 401 });
}

      await env.CARD_ORDER.put(SEED_USER_ID, JSON.stringify(body));
      return Response.json({ ok: true });
    }

    return new Response("Not Found", { status: 404 });
  }
};

/* ================= HTML 内容（仅此一处） ================= */
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nav-CF</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect x=%2215%22 y=%2220%22 width=%2255%22 height=%2210%22 rx=%225%22 fill=%22black%22/><rect x=%2225%22 y=%2240%22 width=%2255%22 height=%2210%22 rx=%225%22 fill=%22black%22/><rect x=%2235%22 y=%2260%22 width=%2255%22 height=%2210%22 rx=%225%22 fill=%22black%22/></svg>"><text y=%22.9em%22 font-size=%2280%22>⭐</text></svg>">
  <style>
    /* ========= 全局 ========= */
    :root{
      /* Light mode: 黑色主色 */
      --primary:#111111;
      --primary-hover:#000000;
      --primary-soft:rgba(0,0,0,.15);
      --danger:#e74c3c;
      --danger-hover:#c0392b;

      --bg:rgb(250,250,250);
      --text:#222;
      --muted:#888;

      --dark-bg:#121418;
      --dark-card:#1e2128;
      --dark-surface:#252830;
      --dark-border:#2a2e38;
      --dark-text:#e3e3e3;
      --dark-muted:#a0a0a0;

      --dark-primary:#5d7fb9;
      --dark-primary-hover:#4a6fa5;
    }

    @media (prefers-color-scheme: dark){
      :root{
        --primary:#f5f5f5;
        --primary-hover:#ffffff;
        --primary-soft:rgba(255,255,255,.25);
      }
    }


    img, svg{
      filter:none !important;
      mix-blend-mode:normal !important;
    }

    body{
      font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;
      margin:0;padding:0;
      background-color:var(--bg);
      color:var(--text);
      transition:all .3s ease;
    }
    body.dark-theme{
      background-color:var(--dark-bg);
      color:var(--dark-text);
    }

    
    .site-header{
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      margin-top:6px;
      margin-bottom:6px;
      text-align:center;
    }
    #site-title{
      font-size:24px;
      font-weight:700;
      cursor:pointer;
      line-height:1.2;
      margin-bottom:2px;
    }
    #site-datetime{
      font-size:13px;
      color:var(--muted);
      line-height:1.2;
      white-space:nowrap;
    }

    /* ========= 顶部固定区 ========= */
    .fixed-elements{
      position:fixed;top:0;left:0;right:0;
      background-color:var(--bg);
      z-index:1000;
      padding:10px;
      height:190px;
      box-shadow:none;
      transition:all .3s ease;
    }
    body.dark-theme .fixed-elements{
      background-color:var(--dark-bg);
      box-shadow:none;
    }
    .fixed-elements h3{
      position:absolute;top:10px;left:20px;
      margin:0;
      font-size:22px;font-weight:600;
      color:var(--text);
      transition:all .3s ease;
    }
    body.dark-theme .fixed-elements h3{ color:var(--dark-text); }

    .center-content{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:100%;
      text-align:center;
      padding:0 10px;
    }

    /* ========= 右上角控制 ========= */
    .top-right-controls{
      position:fixed;top:10px;right:10px;
      display:flex;align-items:center;gap:10px;
      z-index:1001;
    }
    .admin-btn,.login-btn{
      background-color:var(--primary);
      color:#fff;border:none;border-radius:4px;
      padding:8px 16px;font-size:13px;
      cursor:pointer;transition:all .3s ease;
      font-weight:500;
    }
    .admin-btn:hover,.login-btn:hover{
      background-color:var(--primary-hover);
      transform:translateY(-1px);
    }
    body.dark-theme .admin-btn,body.dark-theme .login-btn{ background-color:var(--dark-primary); }
    body.dark-theme .admin-btn:hover,body.dark-theme .login-btn:hover{ background-color:var(--dark-primary-hover); }

    .github-btn{
      background:none;border:none;cursor:pointer;
      transition:all .3s ease;
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:4px;padding:0;
    }
    .github-btn:hover{ transform:translateY(-2px); }
    .github-btn svg{ width:24px;height:24px;fill:var(--primary);transition:fill .3s ease; }
    body.dark-theme .github-btn svg{ fill:var(--dark-primary); }

    .bookmark-search-toggle{
      background-color:var(--primary);
      color:#fff;border:none;border-radius:4px;
      padding:0;cursor:pointer;
      transition:all .3s ease;
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;position:relative;
    }
    .bookmark-search-toggle:hover{
      background-color:var(--primary-hover);
      transform:translateY(-2px);
    }
    .bookmark-search-toggle svg{ width:20px;height:20px;stroke:#fff; }
    body.dark-theme .bookmark-search-toggle{ background-color:var(--dark-primary); }
    body.dark-theme .bookmark-search-toggle:hover{ background-color:var(--dark-primary-hover); }

    .bookmark-search-dropdown{
      position:absolute;top:100%;right:0;
      width:140px;background:#fff;
      border:1px solid #e0e0e0;border-radius:4px;
      box-shadow:0 4px 12px rgba(0,0,0,.15);
      padding:8px;margin-top:4px;
      display:none;z-index:1002;
    }
    .bookmark-search-dropdown.show{ display:block; }
    .bookmark-search-dropdown input{
      width:100%;
      border:1px solid #e0e0e0;border-radius:4px;
      padding:8px 12px;font-size:13px;
      transition:all .3s ease;
      box-sizing:border-box;
    }
    .bookmark-search-dropdown input:focus{
      border-color:var(--primary);
      box-shadow:0 0 0 2px var(--primary-soft);
      outline:none;
    }
    .bookmark-search-dropdown input::placeholder{ color:#999; }

    body.dark-theme .bookmark-search-dropdown{
      background-color:#323642;border-color:#444;
      box-shadow:0 4px 12px rgba(0,0,0,.3);
    }
    body.dark-theme .bookmark-search-dropdown input{
      background-color:var(--dark-surface);
      color:var(--dark-text);
      border-color:#444;
    }
    body.dark-theme .bookmark-search-dropdown input::placeholder{ color:#888; }

    /* ========= Tooltip（悬浮提示） ========= */
    @media (hover:hover) and (pointer:fine){
      .has-tooltip{ position:relative; }
      .has-tooltip::after{
        content:attr(data-tooltip);
        position:absolute;
        background:rgba(0,0,0,.75);
        color:#fff;padding:6px 10px;border-radius:4px;
        font-size:12px;pointer-events:none;
        opacity:0;transition:opacity .3s;
        white-space:nowrap;z-index:1000;
      }
      .has-tooltip::before{
        content:"";position:absolute;
        border:6px solid transparent;
        opacity:0;transition:opacity .3s;z-index:1000;
      }
      .has-tooltip:hover::after,.has-tooltip:hover::before{ opacity:1; }
      .tooltip-bottom::after{
        top:100%;left:50%;
        margin-top:12px;transform:translateX(-50%);
      }
      .tooltip-bottom::before{
        top:100%;left:50%;
        transform:translateX(-50%);
        border-bottom-color:rgba(0,0,0,.75);
      }
      .tooltip-green::after{ background:var(--primary);color:#fff; }
      .tooltip-green::before{ border-bottom-color:var(--primary); }

      body.dark-theme .has-tooltip::after{ background:rgba(151,151,151,.9);color:#eee; }
      body.dark-theme .has-tooltip::before{ border-bottom-color:rgba(151,151,151,.9); }
      body.dark-theme .tooltip-green::after{ background:var(--dark-primary);color:#fff; }
      body.dark-theme .tooltip-green::before{ border-bottom-color:var(--dark-primary); }
    }

    /* ========= 主体内容 ========= */
    .content{
      margin-top:210px;padding:10px;
      max-width:1600px;margin-left:auto;margin-right:auto;
      transition:opacity .3s ease;
    }
    .loading .content{ opacity:.6; }

    /* ========= 搜索栏 ========= */
    .search-container{ margin-top:10px;display:flex;flex-direction:column;align-items:center;width:100%; }
    .search-bar{
      display:flex;justify-content:center;
      margin-bottom:10px;width:100%;max-width:600px;
      margin-left:auto;margin-right:auto;
      border-radius:8px;overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,.05);
      border:1px solid #e0e0e0;
      transition:all .3s ease;
    }
    .search-bar:focus-within{ box-shadow:0 3px 12px rgba(0,0,0,.1);border-color:var(--primary); }
    .search-bar select{
      border:none;
      background:var(--bg);
      padding:10px 15px;
      font-size:14px;
      color:var(--primary);
      width:120px;
      outline:none;
      appearance:none;
      background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6"><path fill="currentColor" d="M0 0l6 6 6-6z"/></svg>');
      background-repeat:no-repeat;
      background-position:right 10px center;
      cursor:pointer;transition:all .3s ease;
      border-radius:0;
    }
    select option{
      background:#fff;color:#333;padding:10px;font-size:14px;
      white-space:nowrap;overflow:visible;
    }
    .search-bar input{
      flex:1;border:none;padding:10px 15px;font-size:14px;
      background:#fff;outline:none;
    }
    .search-bar button{
      border:none;background:var(--primary);
      color:#fff;padding:0 20px;cursor:pointer;
      transition:background-color .3s;
    }
    .search-bar button:hover{ background:var(--primary-hover); }

    body.dark-theme .search-bar{ border-color:#323642;background:#1e2128; }
    body.dark-theme .search-bar select{
      background-color:var(--dark-surface);
      color:var(--dark-primary);
      background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6"><path fill="%235d7fb9" d="M0 0l6 6 6-6z"/></svg>');
    }
    body.dark-theme .search-bar input{ background-color:var(--dark-surface);color:var(--dark-text); }
    body.dark-theme .search-bar button{ background-color:var(--dark-primary); }
    body.dark-theme select option{ background-color:var(--dark-surface);color:var(--dark-text); }

    /* ========= 分类快捷按钮 ========= */
    .category-buttons-container{
      display:flex;flex-wrap:wrap;
      justify-content:center;gap:6px;
      padding:8px 12px;width:100%;
      max-width:1200px;margin:5px auto 0;
      background:transparent;border-radius:8px;
      box-shadow:none;transition:all .3s ease;
      position:relative;
    }
    .category-button{
      padding:5px 10px;border-radius:15px;
      background:#f9fafb;color:var(--primary);
      border:none;cursor:pointer;
      font-size:12px;font-weight:500;
      transition:all .2s ease;
      box-shadow:0 2px 4px rgba(0,0,0,.08);
      flex:0 0 auto;white-space:nowrap;
      margin:0 2px;
      position:relative;overflow:hidden;
    }
    .category-button:hover{
      background:var(--primary);color:#fff;
      transform:translateY(-1px);
      box-shadow:0 3px 5px rgba(0,0,0,.12);
    }
    .category-button.active{
      background:var(--primary);color:#fff;
      box-shadow:0 2px 5px rgba(0,0,0,.12);
      transform:translateY(-1px);
      font-weight:600;
      border-bottom:2px solid var(--primary-hover);
    }
    body.dark-theme .category-button{
      background:#2a2e38;color:var(--dark-primary);
      box-shadow:0 2px 4px rgba(0,0,0,.2);
    }
    body.dark-theme .category-button:hover,
    body.dark-theme .category-button.active{
      background:var(--dark-primary);color:#fff;
      border-bottom-color:var(--dark-primary-hover);
    }

    /* ========= 管理按钮（右侧圆形） ========= */
    .add-remove-controls{
      display:none;
      position:fixed;
      right:20px;
      top:180px; /* 避开顶部固定栏，确保第一个按钮完全可见 */
      transform:none;
      z-index:900;
      background:rgba(241,245,249,.95); /* 后台常用浅灰色调 */
      border:1px solid rgba(148,163,184,.6);
      border-radius:14px;
      padding:12px;
      box-shadow:0 8px 24px rgba(0,0,0,.12);
      backdrop-filter:blur(6px);
      flex-direction:column;
      align-items:flex-start;
      gap:10px;
      max-height:calc(100vh - 220px);
      overflow:auto;
    }
    body.dark-theme .add-remove-controls{
      background:rgba(30,41,59,.92);
      border-color:rgba(71,85,105,.65);
      box-shadow:0 10px 28px rgba(0,0,0,.35);
    }
    .admin-panel-title{
      font-size:13px;
      font-weight:700;
      color:#334155;
      letter-spacing:.5px;
      margin:2px 0 6px 2px;
    }
    body.dark-theme .admin-panel-title{ color:#cbd5e1; }
    .admin-action{
      display:flex;
      align-items:center;
      gap:10px;
    }
    .admin-label{
      font-size:13px;
      font-weight:600;
      color:#1f2937;
      white-space:nowrap;
      line-height:1.2;
    }
    body.dark-theme .admin-label{ color:#e5e7eb; }
.round-btn{
      background:var(--primary);
      color:#fff;border:none;border-radius:50%;
      width:40px;height:40px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;cursor:pointer;
      box-shadow:0 3px 10px rgba(0,0,0,.15);
      transition:all .3s ease;
      position:relative;
    }
    .round-btn:hover{
      transform:translateY(-3px);
      box-shadow:0 5px 15px rgba(0,0,0,.2);
    }
    body.dark-theme .round-btn{ background:var(--dark-primary); }
    .round-btn svg{ pointer-events:none;display:block;margin:auto; }

    /* 按钮顺序 */
    .add-btn{ order:1; }
    .remove-btn{ order:2; }
    .category-add-btn{ order:3; }
    .category-manage-btn{ order:4; }
    .export-btn{ order:5; }
    .import-btn{ order:6; }

    
    .ai-btn{
      background:var(--primary);
      color:#fff;
      border:none;
      border-radius:6px;
      padding:6px 10px;
      font-size:12px;
      cursor:pointer;
      white-space:nowrap;
    }
    .ai-btn:hover{
      background:var(--primary-hover);
    }

    /* ========= 分类区 & 卡片 ========= */
    .section{ margin-bottom:25px;padding:0 15px; }
    .section-title-container{
      display:flex;align-items:center;
      margin-bottom:18px;
      border-bottom:1px solid #e0e0e0;
      padding-bottom:10px;
      width:100%;max-width:1520px;
      margin-left:auto;margin-right:auto;
      transition:border-color .3s ease;
    }
    body.dark-theme .section-title-container{ border-bottom-color:var(--dark-border); }
    .section-title{
      font-size:22px;font-weight:600;
      color:var(--text);
      position:relative;padding-left:15px;
      transition:color .3s ease;
      min-width:120px;
    }
    body.dark-theme .section-title{ color:var(--dark-text); }
    .section-title:before{
      content:'';position:absolute;
      left:0;top:50%;
      transform:translateY(-50%);
      width:5px;height:22px;
      background:var(--primary);
      border-radius:2px;
    }
    body.dark-theme .section-title:before{ background:var(--dark-primary); }

    .card-container{
      display:grid;
      grid-template-columns:repeat(auto-fit,150px);
      column-gap:35px;row-gap:15px;
      justify-content:start;
      padding:15px 15px 15px 45px;
      margin:0 auto;max-width:1600px;
    }
    .card{
      background:#fff;border-radius:8px;
      padding:12px;width:150px;
      box-shadow:0 3px 10px rgba(0,0,0,.06);
      cursor:pointer;transition:all .3s ease;
      position:relative;user-select:none;
      border-left:3px solid var(--primary);
      animation:fadeIn .3s ease forwards;
      animation-delay:calc(var(--card-index) * .05s);
      opacity:0;margin:2px;
    }
    body.dark-theme .card{
      background:var(--dark-card);
      border-left-color:var(--dark-primary);
      box-shadow:0 4px 12px rgba(0,0,0,.2);
    }
    @keyframes fadeIn{ from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
    .card:hover{ transform:translateY(-5px);box-shadow:0 8px 15px rgba(0,0,0,.08); }

    .card-top{ display:flex;align-items:center;margin-bottom:5px; }
    .card-icon{ width:16px;height:16px;margin-right:5px; }
    .card-title{
      font-size:15px;font-weight:600;
      color:var(--text);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      transition:color .3s ease;
    }
    .card-desc{
      font-size:12px;
      color:var(--muted);
      margin-bottom:4px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .card-url{
      display:none;

      font-size:12px;color:var(--muted);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      transition:color .3s ease;
    }
    body.dark-theme .card-title{ color:var(--dark-text); }
    body.dark-theme .card-url{
      display:none;
 color:var(--dark-muted); }

    .private-tag{
      background:#ff9800;color:#fff;
      font-size:10px;padding:2px 5px;border-radius:3px;
      position:absolute;top:18px;right:5px;z-index:5;
    }

    /* 卡片描述提示框（鼠标跟随） */
    #custom-tooltip{
      position:absolute;display:none;z-index:700;
      background:var(--primary);color:#fff;
      padding:6px 10px;border-radius:5px;font-size:12px;
      pointer-events:none;max-width:300px;white-space:pre-wrap;
      box-shadow:0 2px 10px rgba(0,0,0,.2);
      transition:opacity .2s ease;
    }
    body.dark-theme #custom-tooltip{ background:var(--dark-primary); }

    /* 卡片按钮（编辑/删除） */
    .card-actions{
      position:absolute;top:-12px;right:-12px;
      display:flex;align-items:center;justify-content:center;
      gap:4px;z-index:15;height:24px;
    }
    .card-btn{
      position:relative;z-index:1;
      width:24px;height:24px;border:none;border-radius:50%;
      background:var(--primary);color:#fff;
      font-size:12px;cursor:pointer;
      display:none;align-items:center;justify-content:center;
      transition:transform .2s, opacity .2s, box-shadow .2s;
      padding:0;margin:0;
      box-shadow:0 2px 4px rgba(0,0,0,.2);
      flex-shrink:0;vertical-align:top;
    }
    .card-btn:hover{ z-index:2;transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,.3); }
    .card-btn svg{ width:14px;height:14px;stroke:currentColor;fill:none;display:block;margin:auto; }
    .delete-btn{ background:var(--danger); }
    body.dark-theme .edit-btn{ background:var(--dark-primary); }
    body.dark-theme .delete-btn{ background:var(--danger); }

    @media (hover:hover) and (pointer:fine){
      .card:hover{ transform:scale(1.05);box-shadow:0 10px 10px rgba(0,0,0,.3); }
      .card.no-hover:hover{ transform:none !important;box-shadow:0 5px 5px rgba(0,0,0,.2) !important; }
      body.dark-theme .card.no-hover:hover{ transform:none !important;box-shadow:0 5px 5px rgba(0,0,0,.2) !important; }
    }

    /* ========= 分类管理按钮 ========= */
    .edit-category-btn,.move-category-btn,.delete-category-btn{
      border:none;padding:4px 8px;margin-left:8px;
      border-radius:4px;font-size:12px;cursor:pointer;
      transition:all .2s;display:none;
      color:#fff;
    }
    .edit-category-btn{ background:var(--primary); }
    .edit-category-btn:hover{ background:var(--primary-hover); }
    .move-category-btn{
      background:var(--dark-primary);
      padding:4px 6px;min-width:28px;
      display:inline-flex;align-items:center;justify-content:center;
    }
    .move-category-btn:hover{ background:var(--dark-primary-hover); }
    .move-category-btn svg{ width:16px;height:16px;fill:#fff; }
    .delete-category-btn{ background:var(--danger); }
    .delete-category-btn:hover{ background:var(--danger-hover); }

    body.dark-theme .edit-category-btn{ background:var(--dark-primary); }
    body.dark-theme .edit-category-btn:hover{ background:var(--dark-primary-hover); }
    body.dark-theme .move-category-btn{ background:var(--primary); }
    body.dark-theme .move-category-btn:hover{ background:var(--primary-hover); }
    body.dark-theme .delete-category-btn{ background:var(--danger); }
    body.dark-theme .delete-category-btn:hover{ background:var(--danger-hover); }

    .category-manage-btn.active{ background:var(--danger); }
    .category-manage-btn.active:hover{ background:var(--danger-hover); }

    /* ========= 浮动按钮 ========= */
    .floating-button-group{
      position:fixed;bottom:50px;right:20px;
      display:flex;flex-direction:column;gap:15px;
      z-index:1000;
    }
    .floating-button-group button{
      width:40px;height:40px;border-radius:50%;
      font-size:20px;display:flex;align-items:center;justify-content:center;
      background:var(--primary);color:#fff;border:none;
      cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2);
      transition:all .2s ease;
    }
    .floating-button-group button:hover{ transform:translateY(-2px);background:var(--primary-hover); }
    #back-to-top-btn{ display:none; }
    body.dark-theme .floating-button-group button{ background:var(--dark-primary); }
    body.dark-theme .floating-button-group button:hover{ background:var(--dark-primary-hover); }
    #theme-toggle{ font-size:24px;line-height:40px; }

    /* ========= 对话框/弹窗 ========= */
    #dialog-overlay{
      display:none;position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,.6);
      justify-content:center;align-items:center;
      z-index:2000;backdrop-filter:blur(3px);
    }
    #dialog-box{
      background:#fff;padding:25px;border-radius:10px;width:350px;
      box-shadow:0 10px 30px rgba(0,0,0,.15);
      animation:dialogFadeIn .3s ease;
    }
    @keyframes dialogFadeIn{ from{opacity:0;transform:translateY(-20px);} to{opacity:1;transform:translateY(0);} }
    #dialog-box input,#dialog-box select{
      width:100%;margin-bottom:15px;padding:10px;
      border:1px solid #e0e0e0;border-radius:5px;
      font-size:14px;transition:all .3s ease;box-sizing:border-box;
    }
    #dialog-box input:focus,#dialog-box select:focus{
      border-color:var(--primary);
      box-shadow:0 0 0 2px var(--primary-soft);
      outline:none;
    }
    #dialog-box label{ display:block;margin-bottom:5px;font-weight:500;color:var(--text); }
    #dialog-box button{
      background:var(--primary);color:#fff;border:none;
      padding:10px 15px;border-radius:5px;cursor:pointer;
      transition:all .3s ease;margin-right:10px;
    }
    #dialog-box button:hover{ background:var(--primary-hover); }
    #dialog-box button.cancel{ background:#f0f0f0;color:#333; }
    #dialog-box button.cancel:hover{ background:#e0e0e0; }

    body.dark-theme #dialog-box{ background:var(--dark-surface);color:var(--dark-text); }
    body.dark-theme #dialog-box input,body.dark-theme #dialog-box select{
      background:#323642;color:var(--dark-text);border-color:#444;
    }
    body.dark-theme #dialog-box label{ color:#a0b7d4; }

    /* 登录弹窗 */
    .login-modal{
      display:none;position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,.6);justify-content:center;align-items:center;
      z-index:2000;backdrop-filter:blur(3px);
    }
    .login-modal-content{
      background:#fff;padding:25px;border-radius:10px;width:300px;
      box-shadow:0 10px 30px rgba(0,0,0,.15);
      animation:modalFadeIn .3s ease;
    }
    @keyframes modalFadeIn{ from{opacity:0;transform:translateY(-20px);} to{opacity:1;transform:translateY(0);} }
    .login-modal h3{ margin:0 0 20px;color:#333;text-align:center;font-size:18px; }
    .login-modal input{
      width:100%;margin-bottom:15px;padding:10px;
      border:1px solid #e0e0e0;border-radius:5px;
      font-size:14px;transition:all .3s ease;box-sizing:border-box;
    }
    .login-modal input:focus{
      border-color:var(--primary);
      box-shadow:0 0 0 2px var(--primary-soft);
      outline:none;
    }
    .login-modal-buttons{ display:flex;gap:10px;justify-content:flex-end; }
    .login-modal button{
      background:var(--primary);color:#fff;border:none;
      padding:10px 15px;border-radius:5px;cursor:pointer;
      transition:all .3s ease;font-size:13px;
    }
    .login-modal button:hover{ background:var(--primary-hover); }
    .login-modal button.cancel{ background:#f0f0f0;color:#333; }
    .login-modal button.cancel:hover{ background:#e0e0e0; }

    body.dark-theme .login-modal-content{ background:var(--dark-surface);color:var(--dark-text); }
    body.dark-theme .login-modal h3{ color:var(--dark-text); }
    body.dark-theme .login-modal input{ background:#323642;color:var(--dark-text);border-color:#444; }

    /* 自定义 alert/confirm */
    .dialog-overlay{
      display:none;position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,.6);backdrop-filter:blur(4px);
      justify-content:center;align-items:center;
      z-index:1000;animation:fadeIn .3s ease;
    }
    .dialog-box{
      background:#fff;padding:24px;border-radius:12px;width:340px;
      box-shadow:0 10px 25px rgba(0,0,0,.1);
      transform:translateY(-20px);
      animation:slideUp .3s ease forwards;
    }
    .dialog-title{ margin:0 0 15px;font-size:18px;color:#333; }
    .dialog-content{ padding:15px 0;margin-bottom:16px;font-size:16px;line-height:1.5;color:#333; }
    .dialog-box input[type="text"]{
      width:100%;margin-bottom:16px;padding:10px 12px;
      border:1px solid #e0e0e0;border-radius:8px;
      font-size:14px;transition:all .2s;box-sizing:border-box;
      background:#fff !important;
    }
    .dialog-box input[type="text"]:focus{
      border-color:var(--primary-hover) !important;
      outline:none;
      box-shadow:0 0 0 3px var(--primary-soft);
    }
    .dialog-buttons{ display:flex;justify-content:flex-end;gap:10px; }
    .dialog-box button{
      padding:8px 16px;border-radius:6px;border:none;
      font-size:14px;cursor:pointer;transition:all .2s;
    }
    .dialog-confirm-btn{ background:var(--primary);color:#fff; }
    .dialog-confirm-btn:hover{ background:var(--primary-hover); }
    .dialog-cancel-btn{ background:#f0f0f0;color:#555; }
    .dialog-cancel-btn:hover{ background:#e0e0e0; }
    .top-z-index{ z-index:9999; }
    @keyframes fadeIn{ from{opacity:0;} to{opacity:1;} }
    @keyframes slideUp{ from{transform:translateY(20px);opacity:0;} to{transform:translateY(0);opacity:1;} }

    body.dark-theme .dialog-box{ background:#2d3748;box-shadow:0 10px 25px rgba(0,0,0,.3); }
    body.dark-theme .dialog-title, body.dark-theme .dialog-content{ color:#f8f9fa; }
    body.dark-theme .dialog-box input[type="text"]{
      background:#3c4658 !important;color:var(--dark-text) !important;border-color:#4a5568 !important;
    }
    body.dark-theme .dialog-box input[type="text"]:focus{
      border-color:var(--dark-primary) !important;
      box-shadow:0 0 0 3px rgba(93,127,185,.3);
    }
    body.dark-theme .dialog-cancel-btn{ background:#4a5568;color:var(--dark-text); }
    body.dark-theme .dialog-cancel-btn:hover{ background:#3c4658; }
    body.dark-theme .dialog-confirm-btn{ background:var(--dark-primary); }
    body.dark-theme .dialog-confirm-btn:hover{ background:var(--dark-primary-hover); }

    /* 加载遮罩 */
    #loading-mask{
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,.6);backdrop-filter:blur(4px);
      z-index:7000;display:flex;align-items:center;justify-content:center;
    }
    .loading-content{
      background:#fff;padding:20px 40px;border-radius:10px;
      text-align:center;box-shadow:0 0 10px #0003;
      font-size:16px;color:#333;
    }
    .spinner{
      width:40px;height:40px;border:4px solid #ccc;
      border-top-color:var(--primary);border-radius:50%;
      margin:0 auto 10px;animation:spin 1s linear infinite;
    }
    @keyframes spin{ to{ transform:rotate(360deg);} }
    body.dark-theme .loading-content{ background:#2d3748;color:#f8f9fa; }

    /* 搜索结果 */
    .search-results-section{ margin-bottom:30px; }
    .search-results-header{
      display:flex;justify-content:space-between;align-items:center;
      margin-bottom:20px;padding:15px;background:#f8f9fa;
      border-radius:8px;border-left:4px solid var(--primary);
    }
    body.dark-theme .search-results-header{
      background:#2d3748;border-left-color:var(--dark-primary);
    }
    .search-results-title{ font-size:18px;font-weight:bold;color:#333; }
    body.dark-theme .search-results-title{ color:#e2e8f0; }
    .back-to-main{
      background:var(--primary);color:#fff;border:none;border-radius:4px;
      padding:8px 16px;cursor:pointer;font-size:14px;transition:all .3s ease;
    }
    .back-to-main:hover{ background:var(--primary-hover); }
    body.dark-theme .back-to-main{ background:var(--dark-primary); }
    body.dark-theme .back-to-main:hover{ background:var(--dark-primary-hover); }
    .no-search-results{ text-align:center;padding:30px;color:var(--muted);font-size:16px; }
    body.dark-theme .no-search-results{ color:var(--dark-muted); }

    /* 移动端 */
    @media (max-width:480px){
      .fixed-elements{ padding:8px 12px 5px;height:auto;min-height:130px; }
      .content{ margin-top:150px;margin-bottom:100px;padding:15px; }
      .center-content{ position:static;transform:none;width:100%;padding:0 8px; }
      .search-container{ margin-top:15px; }
      .search-bar{ flex-wrap:nowrap;max-width:320px;width:90%;margin:6px auto 8px; }
      .search-bar select{ width:80px;flex:0 0 auto;font-size:12px; }
      .category-buttons-container{
        width:100%;max-width:none;padding:6px;overflow-x:auto;flex-wrap:nowrap;
        justify-content:flex-start;margin:8px auto 5px;gap:4px;
        scrollbar-width:none;-ms-overflow-style:none;
      }
      .category-button{ padding:4px 8px;font-size:11px;margin:0 1px; }
      .card-container{
        grid-template-columns:repeat(2,minmax(140px,1fr));
        column-gap:20px;row-gap:10px;justify-content:center;padding:12px;margin:0 auto;
      }
      .card{ width:auto;max-width:100%;padding:12px;margin:0;border-radius:8px; }
      .card-title{ font-size:13px;max-width:100%; }
      .card-desc{
      font-size:12px;
      color:var(--muted);
      margin-bottom:4px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .card-url{
      display:none;
 font-size:11px;max-width:100%; }
      .add-remove-controls{ right:10px;bottom:120px;top:auto;transform:none;gap:10px;padding:10px;max-height:calc(100vh - 260px); }
      .admin-label{ font-size:12px;max-width:160px;white-space:normal; }
      .admin-panel-title{ font-size:12px; }
      .round-btn{ width:36px;height:36px;font-size:20px; }
      .floating-button-group{ bottom:20px;right:10px; }
      .floating-button-group button{ width:36px;height:36px;font-size:18px; }
      #dialog-box{ width:90%;max-width:350px;padding:20px; }
      .section-title{ font-size:20px;min-width:100px; }
    }
  
/* ===== 后台操作面板修正（固定不随页面滚动） ===== */
.add-remove-controls{
  position: fixed !important;
  right: 20px;
  top: 200px;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  z-index: 2000;
}


/* ===== 描述输入框 + AI 按钮对齐修正 ===== */
.desc-ai-row{
  display:flex;
  align-items:stretch;
  gap:6px;
}
.desc-ai-row input{
  flex:1;
}
.desc-ai-row .ai-btn{
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
}


/* ===== 后台操作面板：边缘拉出模式 ===== */
.add-remove-controls{
  position: fixed !important;
  top: 180px;
  right: -280px;          /* 默认完全隐藏 */
  width: 260px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  z-index: 2000;
  transition: right .25s ease;
}
.add-remove-controls.open{
  right: 20px;
}

/* 右侧边缘拉出按钮 */
.admin-panel-handle{
  position: fixed;
  right: 0;
  top: 55%;
  transform: translateY(-50%);
  width: 14px;
  height: 80px;
  border-radius: 8px 0 0 8px;
  background: var(--primary);
  cursor: pointer;
  z-index: 2100;
}


/* ===== 侧边后台菜单提示：点我（闪烁） ===== */
@keyframes tapMeBlink {
  0%   { opacity: .25; }
  50%  { opacity: 1; }
  100% { opacity: .25; }
}

.admin-panel-hint {
  position: fixed;
  right: 26px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  animation: tapMeBlink 1.2s ease-in-out infinite;
  pointer-events: none;
  white-space: nowrap;
  z-index: 3000;
}

@media (prefers-color-scheme: light) {
  .admin-panel-hint {
    background: #111;
    color: #fff;
  }
}

@media (prefers-color-scheme: dark) {
  .admin-panel-hint {
    background: #fff;
    color: #111;
  }
}

</style>
</head>
<body>
  <div class="fixed-elements">
    <div id="site-title" style="text-align:center;font-size:24px;font-weight:700;cursor:pointer;">我的导航</div>
    <div id="site-datetime" style="text-align:center;font-size:13px;color:var(--muted);margin-top:6px;"></div>

    <div class="center-content">
      <!-- 搜索栏 -->
      <div class="search-container">
        <div class="search-bar">
          <select id="search-engine-select">
            <option value="baidu">百度</option>
            <option value="bing">必应</option>
            <option value="google">谷歌</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>
          <input type="text" id="search-input" placeholder="搜索..." />
          <button id="search-button">🔍</button>
        </div>
      </div>

      <div id="category-buttons-container" class="category-buttons-container"></div>
    </div>

    <!-- 右上角控制区域 -->
    <div class="top-right-controls">
      <button class="admin-btn" id="admin-btn" onclick="toggleAdminMode()" style="display:none;">设置</button>
      <button class="login-btn" id="login-btn" onclick="handleLoginClick()">登录</button>

      <button class="github-btn has-tooltip tooltip-bottom tooltip-green" onclick="openGitHub()" data-tooltip="喜欢请点个star">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </button>

      <div class="bookmark-search-toggle" onclick="toggleBookmarkSearch()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
        <div class="bookmark-search-dropdown" id="bookmark-search-dropdown">
          <input type="text" id="bookmark-search-input" placeholder="搜索书签..." />
        </div>
      </div>
    </div>
  </div>

  <div class="content">
    <!-- 管理控制按钮 -->
    <div class="add-remove-controls">
      <div class="admin-panel-title">后台操作</div>
      <div class="admin-action">
        <button class="round-btn" onclick="editSiteTitle()" title="修改站点名称">
          <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 42h36" stroke="white" stroke-width="4"/>
            <path d="M14 34l20-20 6 6-20 20H14v-6z" stroke="white" stroke-width="4" fill="none"/>
          </svg>
        </button>
        <span class="admin-label">0.修改站点名称</span>
      </div>


      <div class="admin-action">
        <button class="round-btn remove-btn" onclick="toggleRemoveMode()" title="编辑链接">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M42 26v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M14 26.72V34h7.32L42 13.31 34.7 6 14 26.72Z" stroke="white" stroke-width="4" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>
        <span class="admin-label">1.编辑链接（开启/关闭编辑按钮）</span>
      </div>

      <div class="admin-action">
        <button class="round-btn add-btn" onclick="showAddDialog()" title="添加链接">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 6H8a2 2 0 0 0-2 2v8M16 42H8a2 2 0 0 1-2-2v-8M32 42h8a2 2 0 0 0 2-2v-8M32 6h8a2 2 0 0 1 2 2v8" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M32 24H16M24 16v16" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>
        <span class="admin-label">2.添加链接</span>
      </div>

      <div class="admin-action">
        <button class="round-btn category-add-btn" onclick="addCategory()" title="添加分类">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 8c0-1.1.9-2 2-2h12l5 6h17c1.1 0 2 .9 2 2v26c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8Z" stroke="white" stroke-width="4" stroke-linejoin="round" fill="none"/>
          <path d="M18 27h12M24 21v12" stroke="white" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </button>
        <span class="admin-label">3.添加分类</span>
      </div>

      <div class="admin-action">
        <button class="round-btn category-manage-btn" onclick="toggleEditCategory()" title="编辑分类">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 8c0-1.1.9-2 2-2h12l5 6h17c1.1 0 2 .9 2 2v26c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8Z" stroke="white" stroke-width="4" stroke-linejoin="round" fill="none"/>
          <circle cx="24" cy="28" r="4" stroke="white" stroke-width="4" fill="none"/>
          <path d="M24 21v3m0 8v3m4.8-12-2.1 2.1M20.8 31l-2.1 2.1M19 23l2.1 2.1M27 31l2.1 2.1M17 28h3M28 28h3" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
        <span class="admin-label">4.分类管理（改名/删除/上下移动）</span>
      </div>

      <div class="admin-action">
        <button class="round-btn export-btn" onclick="exportData()" title="导出数据">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 6v22" stroke="white" stroke-width="4" stroke-linecap="round"/>
          <path d="M16 20l8 8 8-8" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M10 38h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </button>
        <span class="admin-label">5.导出数据（备份 JSON）</span>
      </div>

      <div class="admin-action">
        <button class="round-btn import-btn" onclick="triggerImport()" title="导入数据">
        <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 42V20" stroke="white" stroke-width="4" stroke-linecap="round"/>
          <path d="M16 28l8-8 8 8" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M10 10h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </button>
        <span class="admin-label">6 导入数据（覆盖恢复）</span>
      </div>

      <input type="file" id="import-file" accept="application/json" style="display:none;" />
    </div>
<!-- 分类和卡片容器 -->
    <div id="sections-container"></div>

    <!-- 浮动按钮组 -->
    <div class="floating-button-group">
      <button id="back-to-top-btn" onclick="scrollToTop()" style="display:none;">
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 24l12-12 12 12m-24 12 12-12 12 12" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button id="theme-toggle" onclick="toggleTheme()">◑</button>
    </div>

    <!-- 添加/编辑链接对话框 -->
    <div id="dialog-overlay">
      <div id="dialog-box">
        <label for="name-input">名称</label>
        <input type="text" id="name-input" placeholder="必填" />
        <label for="url-input">地址</label>
        <input type="text" id="url-input" placeholder="必填" />
        <label for="tips-input">描述</label>
        
<div class="desc-ai-row">
  <input type="text" id="tips-input" placeholder="可选" style="flex:1;" />
  <button type="button" id="ai-generate-btn" class="ai-btn">AI</button>
</div>

        <label for="icon-input">图标</label>
        <input type="text" id="icon-input" placeholder="可选" />
        <label for="category-select">选择分类</label>
        <select id="category-select"></select>

        <div class="private-link-container">
          <label for="private-checkbox">私密链接</label>
          <input type="checkbox" id="private-checkbox" />
        </div>

        <div class="dialog-buttons">
          <button class="dialog-cancel-btn" id="dialog-cancel-btn">取消</button>
          <button class="dialog-confirm-btn" id="dialog-confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 登录弹窗 -->
    <div id="login-modal" class="login-modal">
      <div class="login-modal-content">
        <h3>登录</h3>
        <input type="password" id="login-password" placeholder="请输入密码" />
        <div class="login-modal-buttons">
          <button class="cancel" onclick="hideLoginModal()">取消</button>
          <button onclick="performLogin()">确定</button>
        </div>
      </div>
    </div>

    <!-- 自定义Alert对话框 -->
    <div class="dialog-overlay top-z-index" id="custom-alert-overlay" style="display:none;">
      <div class="dialog-box" id="custom-alert-box">
        <h3 class="dialog-title" id="custom-alert-title">提示</h3>
        <div class="dialog-content" id="custom-alert-content">这里是提示内容</div>
        <div class="dialog-buttons">
          <button class="dialog-confirm-btn" id="custom-alert-confirm">确定</button>
        </div>
      </div>
    </div>

    <!-- 自定义Confirm对话框 -->
    <div class="dialog-overlay top-z-index" id="custom-confirm-overlay" style="display:none;">
      <div class="dialog-box">
        <div class="dialog-content" id="custom-confirm-message"></div>
        <div class="dialog-buttons">
          <button id="custom-confirm-cancel" class="dialog-cancel-btn">取消</button>
          <button id="custom-confirm-ok" class="dialog-confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 分类名称输入对话框 -->
    <div class="dialog-overlay" id="category-dialog" style="display:none;">
      <div class="dialog-box">
        <h3 id="category-dialog-title" class="dialog-title">新建分类</h3>
        <input type="text" id="category-name-input" class="category-dialog-input" placeholder="请输入分类名称" />
        <div class="dialog-buttons">
          <button id="category-cancel-btn" class="dialog-cancel-btn">取消</button>
          <button id="category-confirm-btn" class="dialog-confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div id="loading-mask" style="display:none;">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>加载中，请稍候...</p>
      </div>
    </div>

  </div>

  <div id="custom-tooltip"></div>

  
<script>
document.addEventListener("DOMContentLoaded", () => {
  // 只有登录后才显示“点我”提示
  const isLoggedIn = !!localStorage.getItem("authToken");
  if (!isLoggedIn) return;

  const handle = document.querySelector(".admin-panel-handle");
  if (!handle) return;

  if (document.querySelector(".admin-panel-hint")) return;

  const hint = document.createElement("span");
  hint.className = "admin-panel-hint";
  hint.textContent = "点我";

  document.body.appendChild(hint);

  const syncPosition = () => {
    const rect = handle.getBoundingClientRect();
    hint.style.top = (rect.top + rect.height / 2) + "px";
  };

  syncPosition();
  window.addEventListener("scroll", syncPosition);
  window.addEventListener("resize", syncPosition);
});
</script>


</body>
</html>
`;

/* =================== Seed Data (optional) =================== */
let __seedEnsured = false;
async function ensureSeed(env) {
  if (__seedEnsured) return;
  try {
    const existing = await env.CARD_ORDER.get(SEED_USER_ID);
    if (!existing) {
      await env.CARD_ORDER.put(SEED_USER_ID, JSON.stringify(SEED_DATA));
    }
  } catch (e) {
    // Ignore seed init errors to avoid blocking the site
  } finally {
    __seedEnsured = true;
  }
}


/* =================== Security Helpers (Worker) =================== */

// Constant-time comparison to mitigate timing attacks
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Validate token (timestamp.hash), 15-minute TTL
async function validateServerToken(authToken, env) {
  if (!authToken) {
    return {
      isValid: false,
      status: 401,
      response: { error: "Unauthorized", message: "未登录或登录已过期" }
    };
  }

  try {
    const parts = authToken.split(".");
    if (parts.length !== 2) {
      return {
        isValid: false,
        status: 401,
        response: { error: "Invalid token", tokenInvalid: true, message: "登录状态无效，请重新登录" }
      };
    }

    const timestamp = parts[0];
    const hash = parts[1];
    const tokenTimestamp = parseInt(timestamp, 10);
    const now = Date.now();

    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    if (now - tokenTimestamp > FIFTEEN_MINUTES) {
      return {
        isValid: false,
        status: 401,
        response: { error: "Token expired", tokenExpired: true, message: "登录已过期，请重新登录" }
      };
    }

    const tokenData = timestamp + "_" + env.ADMIN_PASSWORD;
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expectedHash = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer))));

    if (!constantTimeCompare(hash, expectedHash)) {
      return {
        isValid: false,
        status: 401,
        response: { error: "Invalid token", tokenInvalid: true, message: "登录状态无效，请重新登录" }
      };
    }

    return { isValid: true };
  } catch (e) {
    return {
      isValid: false,
      status: 401,
      response: { error: "Invalid token", tokenInvalid: true, message: "登录验证失败，请重新登录" }
    };
  }
}

// Admin validation (reserved for future extensions)
async function validateAdminToken(authToken, env) {
  const validation = await validateServerToken(authToken, env);
  if (!validation.isValid) return validation;
  return { isValid: true, isAdmin: true };
}
