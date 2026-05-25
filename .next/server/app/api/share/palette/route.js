"use strict";(()=>{var e={};e.id=1303,e.ids=[1303],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9164:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>m,requestAsyncStorage:()=>x,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>u});var a={};r.r(a),r.d(a,{POST:()=>p});var s=r(9303),i=r(8716),l=r(670),o=r(7070),n=r(1926);async function p(e){var t;let r=(0,n.n)(),{data:{user:a}}=await r.auth.getUser();if(!a)return o.NextResponse.json({error:"unauthorized"},{status:401});let{paletteName:s,colors:i,undertone:l,depth:p}=await e.json(),d=(t={paletteName:s||"Aube nordique",colors:i||[{hex:"#F6F2EC",label:"Bone"},{hex:"#E5C8B8",label:"Rose p\xe2le"},{hex:"#B05670",label:"Berry whisper"}],undertone:l||"n\xf8ytral",depth:p||"fair"},`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <style>
      .display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; }
      .body { font-family: 'Inter Tight', -apple-system, sans-serif; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1350" fill="#F6F2EC"/>

  <!-- Border -->
  <rect x="40" y="40" width="1000" height="1270" fill="none" stroke="#D9CFC1" stroke-width="1"/>

  <!-- Top eyebrow -->
  <text x="540" y="160" text-anchor="middle" class="body"
    font-size="14" letter-spacing="6" fill="#8A8278">
    TONEUP \xb7 DIN PALETT
  </text>

  <!-- Palette name (the hero) -->
  <text x="540" y="290" text-anchor="middle" class="display"
    font-size="84" font-weight="400" fill="#1C1A17" letter-spacing="2">
    ${c(t.paletteName)}
  </text>

  <!-- Italic line -->
  <text x="540" y="350" text-anchor="middle" class="display"
    font-size="32" font-style="italic" fill="#4A453E">
    N\xb0 01
  </text>

  <!-- Divider -->
  <line x1="480" y1="420" x2="600" y2="420" stroke="#8A8278" stroke-width="1"/>

  <!-- Palette circles -->
  ${t.colors.map((e,t)=>{let r=270+270*t;return`
      <circle cx="${r}" cy="630" r="100" fill="${e.hex}" />
      <circle cx="${r}" cy="630" r="100" fill="none" stroke="#1C1A17" stroke-width="0.5" opacity="0.15"/>
      <text x="${r}" y="780" text-anchor="middle" class="display"
        font-size="22" font-style="italic" fill="#4A453E">
        ${c(e.label)}
      </text>
    `}).join("")}

  <!-- Meta -->
  <text x="540" y="950" text-anchor="middle" class="body"
    font-size="12" letter-spacing="4" fill="#8A8278">
    UNDERTONE \xb7 ${c(t.undertone.toUpperCase())}
  </text>
  <text x="540" y="985" text-anchor="middle" class="body"
    font-size="12" letter-spacing="4" fill="#8A8278">
    DYBDE \xb7 ${c(t.depth.toUpperCase())}
  </text>

  <!-- Divider -->
  <line x1="480" y1="1060" x2="600" y2="1060" stroke="#8A8278" stroke-width="1"/>

  <!-- Bottom signature -->
  <text x="540" y="1140" text-anchor="middle" class="display"
    font-size="40" font-style="italic" fill="#1C1A17">
    toneup
  </text>
  <text x="540" y="1185" text-anchor="middle" class="body"
    font-size="11" letter-spacing="5" fill="#8A8278">
    EN STILLE STUDIE AV HUDENS LYS
  </text>
  <text x="540" y="1235" text-anchor="middle" class="body"
    font-size="10" letter-spacing="3" fill="#B5A795">
    toneup.app
  </text>
</svg>`),x=crypto.randomUUID().replace(/-/g,"").slice(0,16),u=`palette-cards/${a.id}/${x}.svg`;await r.storage.from("shareable-cards").upload(u,d,{contentType:"image/svg+xml",upsert:!0}),await r.from("shareable_cards").insert({user_id:a.id,card_type:"palette",image_path:u,share_token:x});let{data:h}=r.storage.from("shareable-cards").getPublicUrl(u);return o.NextResponse.json({svg:d,shareToken:x,publicUrl:h.publicUrl})}function c(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}let d=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/share/palette/route",pathname:"/api/share/palette",filename:"route",bundlePath:"app/api/share/palette/route"},resolvedPagePath:"C:\\projects\\toneup\\src\\app\\api\\share\\palette\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:u,serverHooks:h}=d,y="/api/share/palette/route";function m(){return(0,l.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:u})}},1926:(e,t,r)=>{r.d(t,{n:()=>s});var a=r(7721);function s(){let{cookies:e}=r(1615),t=e();return(0,a.createServerClient)("https://dyytdvnihireswepbkxk.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eXRkdm5paGlyZXN3ZXBia3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTkzNDIsImV4cCI6MjA5NTI5NTM0Mn0.muOul3oTOM3TtiT7r-OB988LN8omtYJUMTC5eRiB5DY",{cookies:{get:e=>t.get(e)?.value,set:(e,r,a)=>t.set({name:e,value:r,...a}),remove:(e,r)=>t.set({name:e,value:"",...r})}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[9276,6554,8064,9702,5972],()=>r(9164));module.exports=a})();