/* ===================================================================
   Piano Professor — Graduation Diploma
   Shareable certificate shown after the final lesson of a milestone.
   Funny quotes are written natively per language (NOT translated).
   =================================================================== */
const { useState: useDip, useRef: useDipR } = React;

/* Hilarious graduation quotes — one per level, authored natively per language. */
const PP_DIPLOMA_QUOTES = {
  kg: {
    en: "Can now find Middle C without a map. The journey begins.",
    zh: "终于不看地图也能找到中央 C 了，可喜可贺。",
    es: "Ya encuentra el Do central sin GPS. Empieza la aventura.",
    fr: "Trouve le Do central sans GPS. L'aventure commence.",
    de: "Findet das mittlere C jetzt ohne Navi. Das Abenteuer beginnt.",
    ja: "もう地図なしで真ん中のドが見つかる。冒険の始まり。",
    ko: "이제 지도 없이도 가온 도를 찾습니다. 모험 시작.",
    vi: "Giờ tìm được nốt Đô giữa mà không cần bản đồ. Hành trình bắt đầu.",
    pt: "Já acha o Dó central sem GPS. Começa a aventura.",
    it: "Ora trova il Do centrale senza navigatore. Inizia l'avventura.",
  },
  el: {
    en: "Survived 'both hands at the same time.' A true pioneer.",
    zh: "成功挑战'两只手一起弹'，并且活了下来。",
    es: "Sobrevivió a 'las dos manos a la vez'. Todo un héroe.",
    fr: "A survécu aux 'deux mains en même temps'. Un vrai pionnier.",
    de: "Hat 'beide Hände gleichzeitig' überlebt. Ein wahrer Held.",
    ja: "『両手同時』を生き延びた、真の勇者。",
    ko: "'양손 동시에'를 견뎌낸 진정한 용사.",
    vi: "Sống sót qua màn 'hai tay cùng lúc'. Một huyền thoại.",
    pt: "Sobreviveu às 'duas mãos ao mesmo tempo'. Um herói.",
    it: "È sopravvissuto a 'tutte e due le mani insieme'. Un eroe.",
  },
  ms: {
    en: "Switches chords smoother than a politician changes opinions.",
    zh: "换和弦比翻脸还快，丝般顺滑。",
    es: "Cambia de acorde más rápido que de excusa.",
    fr: "Change d'accord plus vite que d'avis.",
    de: "Wechselt Akkorde schneller als seine Meinung.",
    ja: "意見を変えるより早くコードを変えられる。",
    ko: "변명보다 빠르게 코드를 바꿉니다.",
    vi: "Đổi hợp âm còn nhanh hơn đổi ý.",
    pt: "Troca de acorde mais rápido do que de desculpa.",
    it: "Cambia accordo più in fretta che idea.",
  },
  hs: {
    en: "Plays off the beat on purpose now. We're calling it 'style.'",
    zh: "现在故意踩在弱拍上——我们管这叫'有范儿'。",
    es: "Ahora toca a contratiempo a propósito. Le decimos 'estilo'.",
    fr: "Joue à contretemps exprès maintenant. On appelle ça 'du style'.",
    de: "Spielt jetzt absichtlich gegen den Takt. Wir nennen das 'Stil'.",
    ja: "今ではわざと裏拍で弾く。それを『味』と呼ぶ。",
    ko: "이제 일부러 엇박으로 칩니다. 우린 그걸 '스타일'이라 부르죠.",
    vi: "Giờ cố tình chơi lệch phách. Bọn mình gọi đó là 'chất'.",
    pt: "Agora toca fora do tempo de propósito. Chamamos de 'estilo'.",
    it: "Ora suona in levare apposta. Lo chiamiamo 'stile'.",
  },
  un: {
    en: "Improvises so confidently that wrong notes apologize and leave.",
    zh: "即兴弹得太自信，连弹错的音都觉得是故意的。",
    es: "Improvisa tan seguro que las notas malas piden perdón y se van.",
    fr: "Improvise si sûr de lui que les fausses notes s'excusent et partent.",
    de: "Improvisiert so souverän, dass falsche Töne sich entschuldigen.",
    ja: "自信満々の即興で、ミスした音まで謝って去っていく。",
    ko: "너무 당당하게 즉흥연주해서 틀린 음이 사과하고 도망갑니다.",
    vi: "Ứng tấu tự tin tới mức nốt sai cũng xin lỗi rồi bỏ đi.",
    pt: "Improvisa tão confiante que as notas erradas pedem desculpa e somem.",
    it: "Improvvisa così sicuro che le note sbagliate si scusano e se ne vanno.",
  },
  ma: {
    en: "Has officially run out of things to learn. The piano is scared.",
    zh: "已经没有什么可学的了，钢琴都怕了（请勿当真）。",
    es: "Oficialmente ya no le queda nada por aprender. El piano tiembla.",
    fr: "N'a officiellement plus rien à apprendre. Le piano a peur.",
    de: "Hat offiziell nichts mehr zu lernen. Das Klavier hat Angst.",
    ja: "もう学ぶことが何もない。ピアノが怯えている（事実確認はご遠慮を）。",
    ko: "공식적으로 더 배울 게 없습니다. 피아노가 무서워합니다.",
    vi: "Chính thức hết thứ để học. Cây đàn cũng phải dè chừng.",
    pt: "Oficialmente não tem mais nada a aprender. O piano se assustou.",
    it: "Ufficialmente non ha più nulla da imparare. Il piano ha paura.",
  },
};

/* Data-driven 'student report' — native template per language with {streak}{xp}{songs}{acc}. */
const PP_DIPLOMA_REVIEW = {
  en: "Showed up {streak} days straight, stacked {xp} XP, learned {songs} songs, and hit the right key {acc}% of the time. The other {acc2}%? We call those 'jazz.'",
  zh: "连续 {streak} 天打卡，狂攒 {xp} 经验，学会 {songs} 首曲子，按对琴键 {acc}%。剩下那 {acc2}%？我们叫它'即兴'。",
  es: "Apareció {streak} días seguidos, juntó {xp} XP, aprendió {songs} canciones y acertó la tecla el {acc}%. ¿El otro {acc2}%? Lo llamamos 'jazz'.",
  fr: "Présent {streak} jours d'affilée, {xp} XP au compteur, {songs} morceaux appris et la bonne touche {acc}% du temps. Les {acc2}% restants ? On appelle ça 'du jazz'.",
  de: "{streak} Tage am Stück dabei, {xp} XP gehortet, {songs} Lieder gelernt und zu {acc}% die richtige Taste getroffen. Die anderen {acc2}%? Nennen wir 'Jazz'.",
  ja: "{streak} 日連続で登場、{xp} XP を荒稼ぎ、{songs} 曲を習得、正しい鍵盤に {acc}% 命中。残りの {acc2}%？それは『ジャズ』。",
  ko: "{streak}일 연속 출석, {xp} XP 적립, {songs}곡 마스터, 정확도 {acc}%로 건반을 눌렀어요. 나머지 {acc2}%? 그건 '재즈'예요.",
  vi: "Chăm chỉ {streak} ngày liên tục, gom {xp} XP, học {songs} bài và bấm đúng phím {acc}%. Còn {acc2}% kia? Bọn mình gọi là 'jazz'.",
  pt: "Apareceu {streak} dias seguidos, juntou {xp} XP, aprendeu {songs} músicas e acertou a tecla {acc}% das vezes. Os outros {acc2}%? A gente chama de 'jazz'.",
  it: "Presente {streak} giorni di fila, {xp} XP in cassa, {songs} brani imparati e tasto giusto nel {acc}% dei casi. Il restante {acc2}%? Lo chiamiamo 'jazz'.",
};

/* certificate palette — always 'paper', independent of app theme */
const DIP = {
  paper: "linear-gradient(165deg,#FFFEF7 0%,#FBF2DA 55%,#F6E9C6 100%)",
  ink: "#3B2F14", soft: "#6E5A2E", gold: "#B07A12", goldLt: "#E3BC57", goldDeep: "#8A5E0C",
  serif: "Georgia, 'Times New Roman', serif",
};

function dipReview(lang, p) {
  const tpl = PP_DIPLOMA_REVIEW[lang] || PP_DIPLOMA_REVIEW.en;
  const songs = 14, acc = 96;
  return tpl
    .replace("{streak}", p.streak)
    .replace("{xp}", (p.xp || 0).toLocaleString())
    .replace("{songs}", songs)
    .replace("{acc2}", 100 - acc)
    .replace("{acc}", acc);
}

/* Corner flourish */
function DipCorner({ pos }) {
  const base = { position: "absolute", width: 30, height: 30, borderColor: DIP.gold, borderStyle: "solid", opacity: 0.85 };
  const m = {
    tl: { top: 12, left: 12, borderWidth: "2px 0 0 2px", borderTopLeftRadius: 6 },
    tr: { top: 12, right: 12, borderWidth: "2px 2px 0 0", borderTopRightRadius: 6 },
    bl: { bottom: 12, left: 12, borderWidth: "0 0 2px 2px", borderBottomLeftRadius: 6 },
    br: { bottom: 12, right: 12, borderWidth: "0 2px 2px 0", borderBottomRightRadius: 6 },
  }[pos];
  return <span style={{ ...base, ...m }} />;
}

/* The shareable certificate card. w = base width (scaled by wrappers). */
function Diploma({ profile, lang, w = 440 }) {
  const p = profile;
  const lvl = (window.PP_LEVELS || []).find((l) => l.id === p.levelId) || (window.PP_LEVELS || [])[1] || { name: "Elementary", grade: 3, color: "#5BB8E3", id: "el" };
  const quote = (PP_DIPLOMA_QUOTES[lvl.id] && (PP_DIPLOMA_QUOTES[lvl.id][lang] || PP_DIPLOMA_QUOTES[lvl.id].en)) || "";
  const stats = [
    { e: "🔥", v: p.streak, c: "#C2410C" },
    { e: "⚡", v: (p.xp >= 1000 ? (p.xp / 1000).toFixed(1) + "k" : p.xp), c: "#9A6E00" },
    { e: "🎵", v: 14, c: "#3D8E00" },
    { e: "🎯", v: "96%", c: "#2E84AD" },
  ];
  return (
    <div style={{
      width: w, position: "relative", background: DIP.paper, borderRadius: 14,
      padding: "30px 34px 26px", color: DIP.ink, fontFamily: DIP.serif,
      boxShadow: `0 0 0 1px ${DIP.goldLt}, 0 0 0 7px #FFFDF5, 0 0 0 9px ${DIP.gold}, 0 30px 70px rgba(40,28,4,.45)`,
      textAlign: "center", overflow: "hidden",
    }}>
      <DipCorner pos="tl" /><DipCorner pos="tr" /><DipCorner pos="bl" /><DipCorner pos="br" />
      {/* faint guilloché glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 50% at 50% 0%, #FFF6D833, transparent 70%)", pointerEvents: "none" }} />

      {/* academy kicker */}
      <div style={{ fontSize: w * 0.026, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: DIP.gold, fontFamily: "Nunito, sans-serif" }}>
        {t("dip.academy", lang)}
      </div>

      {/* seal */}
      <div style={{ position: "relative", width: w * 0.21, height: w * 0.21, margin: "12px auto 6px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `linear-gradient(150deg,${DIP.goldLt},${DIP.gold})`, boxShadow: `0 4px 0 ${DIP.goldDeep}, 0 8px 18px rgba(120,80,0,.35)` }} />
        <div style={{ position: "absolute", inset: 5, borderRadius: "50%", overflow: "hidden", background: "#FFFDF3", display: "grid", placeItems: "center" }}>
          <Maestro mood="trophy" size={w * 0.19} bg="#FFF3CF" />
        </div>
        <span style={{ position: "absolute", bottom: -4, right: -6, fontSize: w * 0.085 }}>🎓</span>
      </div>

      {/* title */}
      <h1 style={{ fontSize: w * 0.072, fontWeight: 700, margin: "6px 0 2px", letterSpacing: 0.5, lineHeight: 1.05 }}>{t("dip.cert", lang)}</h1>
      <div style={{ width: "46%", height: 2, margin: "8px auto 14px", background: `linear-gradient(90deg, transparent, ${DIP.gold}, transparent)` }} />

      {/* awarded to */}
      <div style={{ fontSize: w * 0.03, fontStyle: "italic", color: DIP.soft }}>{t("dip.awardedTo", lang)}</div>
      <div style={{ fontSize: w * 0.092, fontWeight: 700, color: DIP.ink, margin: "2px 0 6px", lineHeight: 1.05 }}>{p.name}</div>
      <div style={{ fontSize: w * 0.034, fontWeight: 700, fontFamily: "Nunito, sans-serif", color: lvl.color }}>
        {t("dip.graduateOf", lang)} · <span style={{ color: DIP.ink }}>{tLevel(lvl.id, lang)} · {t("grade", lang)} {lvl.grade}</span>
      </div>

      {/* stats strip */}
      <div style={{ display: "flex", justifyContent: "center", gap: w * 0.022, margin: "16px auto 12px", fontFamily: "Nunito, sans-serif" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ flex: 1, maxWidth: w * 0.2, background: "#FFFDF4", border: `1.5px solid ${DIP.goldLt}`, borderRadius: 12, padding: `${w * 0.018}px 0` }}>
            <div style={{ fontSize: w * 0.05 }}>{s.e}</div>
            <div style={{ fontSize: w * 0.045, fontWeight: 900, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* student report (data-driven) */}
      <div style={{ fontSize: w * 0.022, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: DIP.gold, fontFamily: "Nunito, sans-serif", marginTop: 4 }}>{t("dip.report", lang)}</div>
      <p style={{ fontSize: w * 0.03, color: DIP.soft, fontFamily: "Nunito, sans-serif", margin: "4px auto 12px", lineHeight: 1.4, maxWidth: "90%" }}>{dipReview(lang, p)}</p>

      {/* hilarious native quote */}
      <div style={{ position: "relative", margin: "2px auto 16px", maxWidth: "92%" }}>
        <span style={{ position: "absolute", left: -2, top: -w * 0.03, fontSize: w * 0.11, color: DIP.goldLt, fontFamily: DIP.serif, lineHeight: 1 }}>“</span>
        <p style={{ fontSize: w * 0.038, fontStyle: "italic", fontWeight: 600, color: DIP.ink, lineHeight: 1.35, margin: 0, padding: "0 14px" }}>{quote}</p>
      </div>

      {/* footer: signature · seal · class */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${DIP.goldLt}` }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: w * 0.06, color: DIP.gold, fontFamily: "'Brush Script MT','Segoe Script',cursive", lineHeight: 1 }}>Maestro</div>
          <div style={{ fontSize: w * 0.022, color: DIP.soft, fontFamily: "Nunito, sans-serif", fontWeight: 700, marginTop: 2 }}>{t("dip.dean", lang)}</div>
        </div>
        <div style={{ width: w * 0.1, height: w * 0.1, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${DIP.goldLt}, ${DIP.goldDeep})`, display: "grid", placeItems: "center", boxShadow: `0 2px 6px rgba(120,80,0,.4)`, flexShrink: 0 }}>
          <span style={{ fontSize: w * 0.05 }}>🏅</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: w * 0.022, color: DIP.soft, fontFamily: "Nunito, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{t("dip.classOf", lang)}</div>
          <div style={{ fontSize: w * 0.045, fontWeight: 900, color: DIP.ink, fontFamily: "Nunito, sans-serif" }}>2026</div>
        </div>
      </div>

      <div style={{ fontSize: w * 0.02, color: DIP.gold, fontFamily: "Nunito, sans-serif", fontWeight: 700, marginTop: 10, opacity: 0.7 }}>pianoprofessor.app</div>
    </div>
  );
}

/* ---- Full-screen celebratory wrapper (tablet) ---- */
function ScreenDiploma({ ctx }) {
  const p = ctx.activeProfile; if (!p) return null;
  const lang = p.lang || "en";
  const share = () => { PP_Audio.success(); ctx.toast(t("dip.shared", lang)); };
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(120% 120% at 50% 0%, #FFF6DC 0%, #FBE9C0 60%, #F3D89A 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Confetti run count={150} />
      <button onClick={() => ctx.go("home")} style={{ position: "absolute", top: 20, left: 20, width: 48, height: 48, borderRadius: 14, border: "none", background: "#ffffff66", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 5 }}><Icon name="close" size={24} color="#5a3d00" /></button>

      <div style={{ display: "flex", alignItems: "center", gap: 40, zIndex: 2 }}>
        <div style={{ animation: "pp-pop .5s cubic-bezier(.3,1.5,.5,1)" }}>
          <Diploma profile={p} lang={lang} w={440} />
        </div>
        <div style={{ maxWidth: 280 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#B07A12", fontFamily: "Nunito, sans-serif" }}>🎉 {t("complete.title", lang)}</div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#3B2F14", margin: "6px 0 10px", lineHeight: 1.05, fontFamily: "Nunito, sans-serif" }}>{t("dip.congrats", lang)}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#6E5A2E", fontFamily: "Nunito, sans-serif", margin: "0 0 22px", lineHeight: 1.4 }}>{tLevel((p.levelId || "el"), lang)} → {t("dip.cert", lang)}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ChunkyButton variant="gold" size="lg" glow full onClick={share} icon={<Icon name="image" size={20} color="#5a3d00" />}>{t("dip.share", lang)}</ChunkyButton>
            <ChunkyButton variant="white" size="md" full onClick={share}>{t("dip.save", lang)}</ChunkyButton>
            <ChunkyButton variant="ghost" size="md" full onClick={() => ctx.go("home")}>{t("complete.backToLearn", lang)}</ChunkyButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Phone landscape wrapper (scaled card) ---- */
function PhDiploma({ ctx }) {
  const p = ctx.activeProfile; if (!p) return null;
  const lang = p.lang || "en";
  const share = () => { PP_Audio.success(); ctx.toast(t("dip.shared", lang)); };
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(120% 120% at 50% 0%, #FFF6DC 0%, #FBE9C0 60%, #F3D89A 100%)", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "0 24px" }}>
      <Confetti run count={90} />
      <button onClick={() => ctx.go("home")} style={{ position: "absolute", top: 12, left: 12, width: 38, height: 38, borderRadius: 11, border: "none", background: "#ffffff66", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 5 }}><Icon name="close" size={20} color="#5a3d00" /></button>
      <div style={{ transform: "scale(.58)", transformOrigin: "center", flexShrink: 0, marginRight: -110, marginLeft: -90 }}>
        <Diploma profile={p} lang={lang} w={420} />
      </div>
      <div style={{ width: 230, zIndex: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#B07A12", fontFamily: "Nunito, sans-serif" }}>🎉 {t("complete.title", lang)}</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#3B2F14", margin: "2px 0 8px", lineHeight: 1.05, fontFamily: "Nunito, sans-serif" }}>{t("dip.congrats", lang)}</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ChunkyButton variant="gold" size="md" glow full onClick={share} icon={<Icon name="image" size={18} color="#5a3d00" />}>{t("dip.share", lang)}</ChunkyButton>
          <ChunkyButton variant="ghost" size="sm" full onClick={() => ctx.go("home")}>{t("complete.backToLearn", lang)}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Diploma, ScreenDiploma, PhDiploma, PP_DIPLOMA_QUOTES, PP_DIPLOMA_REVIEW });
