/* 의사랑 기능 가이드 썸네일 생성기 — 데이터 로더
   data/*.json 을 읽어 window.YSR_DATA 를 만든 뒤 js/app.js 를 실행합니다.
   그림·가이드·분류를 추가할 때는 data/ 폴더의 JSON만 고치면 됩니다(README.md 참고). */
(async () => {
  const get = async (path) => {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${path} (${res.status})`);
    return res.json();
  };
  try {
    const [lib, cats, presets, rules] = await Promise.all([
      get("data/assets.json"),
      get("data/categories.json"),
      get("data/presets.json"),
      get("data/rules.json"),
    ]);
    window.YSR_DATA = {
      SERIES: lib.series,
      // app.js 는 그림 주소를 data 속성으로 읽습니다.
      ASSETS: lib.assets.map((a) => ({ ...a, data: a.file })),
      CATS: Object.fromEntries(cats.map(({ id, ...c }) => [id, c])),
      PRESETS: presets,
      RULES: rules,
    };
    const app = document.createElement("script");
    app.src = "js/app.js";
    document.body.appendChild(app);
  } catch (err) {
    console.error(err);
    const box = document.createElement("div");
    box.className = "note";
    box.setAttribute("role", "alert");
    box.style.margin = "0 0 16px";
    box.textContent = `데이터를 불러오지 못했어요. 새로고침해 주세요. 계속되면 생성기 담당자에게 알려 주세요. (${err.message})`;
    document.querySelector("main").prepend(box);
  }
})();
