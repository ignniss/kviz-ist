// app.js — splash 7s na ulasku na sajt, pa meni sa oblastima
let корен = null;
let стаза = [];
let сесија = null;

const екран = document.getElementById("екран");
const дугмеНазад = document.getElementById("назад");

init();

async function init() {
  // 1) odmah prikaži splash (7s) i paralelno učitaj manifest
  const splashGotov = прикажиУлазниSplash("splash.jpg", 7000);
  const manifestGotov = учитајМанифест();

  // 2) sačekaj da prođe splash I da se učita manifest
  await Promise.all([splashGotov, manifestGotov]);

  // 3) tek sad prikaži meni (ili grešku)
  if (корен) {
    стаза = [корен];
    прикажиТренутни();
    дугмеНазад.onclick = назад;
  } else {
    екран.innerHTML =
      "<p class='порука'>Грешка: манифест није учитан.</p>";
  }
}

async function учитајМанифест() {
  try {
    const одг = await fetch("manifest.json");
    if (!одг.ok) throw new Error("HTTP " + одг.status);
    корен = await одг.json();
  } catch (е) {
    console.error("Грешка:", е);
    корен = null;
  }
}

function тренутни() {
  return стаза[стаза.length - 1];
}

function назад() {
  if (стаза.length <= 1) return;
  сесија = null;
  стаза.pop();
  поставиПозадину(null);
  прикажиТренутни();
}

function прикажиТренутни() {
  const чвор = тренутни();
  дугмеНазад.hidden = стаза.length <= 1;

  if (чвор.карте && чвор.карте.length > 0) {
    започниСесију(чвор.карте);
    return;
  }

  поставиПозадину(null);

  направиМени(
    чвор.деца.map(д => ({
      текст: лепоИме(д.назив),
      клик: () => {
        стаза.push(д);
        прикажиТренутни();
      },
    }))
  );
}

function лепоИме(н) {
  return н.charAt(0).toUpperCase() + н.slice(1);
}

function направиМени(ставке) {
  екран.innerHTML = "";
  if (!ставке.length) {
    екран.innerHTML = "<p class='порука'>Овде још нема карата.</p>";
    return;
  }
  const мени = document.createElement("div");
  мени.className = "мени";
  ставке.forEach((с, и) => {
    const д = document.createElement("button");
    д.className = "ставка-менија";
    д.textContent = с.текст;
    д.style.animationDelay = `${и * 60}ms`;
    д.onclick = с.клик;
    мени.appendChild(д);
  });
  екран.appendChild(мени);
}

/* ---------- ПОЗАДИНА ---------- */
function поставиПозадину(пут) {
  if (пут) {
    document.body.style.setProperty("--позадина", `url("${пут}")`);
    document.body.classList.add("са-позадином");
  } else {
    document.body.classList.remove("са-позадином");
    document.body.style.removeProperty("--позадина");
  }
}

/* ---------- СЕСИЈА ---------- */
function започниСесију(карте) {
  const поредак = [...карте];
  for (let i = поредак.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [поредак[i], поредак[j]] = [поредак[j], поредак[i]];
  }
  сесија = { карте: поредак, индекс: 0, тачно: 0, нетачно: 0 };

  const чвор = тренутни();
  поставиПозадину(чвор.позадина);

  прикажиСледећу();
}

function прикажиСледећу() {
  if (сесија.индекс >= сесија.карте.length) {
    прикажиРезултат();
    return;
  }
  прикажиКартицу(сесија.карте[сесија.индекс]);
}

function прикажиКартицу(карта) {
  екран.innerHTML = "";

  const оквир = document.createElement("div");
  оквир.className = "картица-оквир";

  const прогрес = document.createElement("div");
  прогрес.className = "прогрес";
  прогрес.innerHTML = `
    <span class="прогрес-текст">Питање ${сесија.индекс + 1} / ${сесија.карте.length}</span>
    <div class="прогрес-трака">
      <div class="прогрес-пуњење" style="width:${(сесија.индекс / сесија.карте.length) * 100}%"></div>
    </div>
  `;

  const слика = document.createElement("img");
  слика.className = "картица-слика";
  слика.draggable = false;
  слика.oncontextmenu = е => е.preventDefault();
  слика.src = карта.фајл;

  const дугмад = document.createElement("div");
  дугмад.className = "дугмад";

  ["А", "Б", "В", "Г"].forEach((слово, и) => {
    const д = document.createElement("button");
    д.className = "дугме-одговор";
    д.textContent = слово;
    д.style.animationDelay = `${400 + и * 70}ms`;
    д.onclick = () => провери(д, слово, карта);
    дугмад.appendChild(д);
  });

  const порука = document.createElement("p");
  порука.className = "порука";

  оквир.append(прогрес, слика, дугмад, порука);
  екран.appendChild(оквир);
}

function провери(дугме, изабрано, карта) {
  const сва = дугме.parentElement.querySelectorAll("button");
  сва.forEach(д => (д.disabled = true));
  const порука = дугме.parentElement.parentElement.querySelector(".порука");

  if (изабрано === карта.тачан) {
    сесија.тачно++;
    дугме.classList.add("тачно");
    порука.textContent = "✔ Тачно!";
    сесија.индекс++;
    setTimeout(прикажиСледећу, 1000);
  } else {
    сесија.нетачно++;
    дугме.classList.add("нетачно");
    сва.forEach(д => {
      if (д.textContent === карта.тачан) д.classList.add("тачно");
    });
    порука.textContent = `✘ Нетачно. Тачан одговор: ${карта.тачан}`;
    сесија.индекс++;
    setTimeout(прикажиСледећу, 2600);
  }
}

/* ---------- РЕЗУЛТАТ ---------- */
function прикажиРезултат() {
  дугмеНазад.hidden = false;
  екран.innerHTML = "";

  const укупно = сесија.карте.length;
  const проценат = Math.round((сесија.тачно / укупно) * 100);

  const оквир = document.createElement("div");
  оквир.className = "резултат-оквир";

  оквир.innerHTML = `
    <div class="резултат-круг" style="--попуњено:${проценат}%">
      <span class="резултат-број">${проценат}%</span>
    </div>
    <h2 class="резултат-наслов">${проценат === 100 ? "Савршено!" : проценат >= 70 ? "Одлично!" : проценат >= 40 ? "Солидно!" : "Покушај поново"}</h2>
    <p class="резултат-детаљи">
      Тачно: <strong>${сесија.тачно}</strong> / ${укупно}
    </p>
    <div class="резултат-дугмад">
      <button class="ставка-менија резултат-понови" id="понови">Играј поново</button>
      <button class="ставка-менија резултат-назад" id="изађи">Назад</button>
    </div>
  `;

  екран.appendChild(оквир);

  document.getElementById("понови").onclick = () => започниСесију(тренутни().карте);
  document.getElementById("изађи").onclick = назад;
}

/* ---------- УЛАЗНИ SPLASH (7s na ulasku na sajt) ---------- */
async function прикажиУлазниSplash(пут, трајање) {
  const splash = document.createElement("div");
  splash.className = "игра-splash";

  const слика = document.createElement("img");
  слика.className = "игра-splash-слика";
  слика.alt = "";
  splash.appendChild(слика);

  document.body.appendChild(splash);

  // fade in
  requestAnimationFrame(() => splash.classList.add("видљив"));

  // učitaj sliku (konverzija u JPG 80 preko canvas-a)
  try {
    const url = await конвертујУJpg(пут, 0.8);
    слика.src = url;
    await слика.decode().catch(() => {});
  } catch (е) {
    console.warn("Splash slika nije učitana:", е);
  }

  // čekaj zadato trajanje (7s), pa fade out
  await new Promise(r => setTimeout(r, трајање));

  splash.classList.remove("видљив");
  await new Promise(r => setTimeout(r, 600));
  splash.remove();
}

/* konvertuje sliku (png/jpg) u JPG kvalitet 80 preko canvas-a */
function конвертујУJpg(пут, квалитет = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", квалитет);
        resolve(dataUrl);
      } catch (е) {
        reject(е);
      }
    };
    img.onerror = reject;
    img.src = пут;
  });
}