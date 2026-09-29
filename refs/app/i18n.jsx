/* ===================================================================
   Piano Professor — i18n: 10 languages, UI strings, country song charts,
   localized instructor-voice (TTS) codes.
   Song TITLES are never translated (real charting songs per country).
   =================================================================== */

const PP_LANGS = [
  { code: "en", label: "English",     native: "English",     tts: "en-US", flag: "🇺🇸" },
  { code: "zh", label: "Chinese",     native: "中文",         tts: "zh-CN", flag: "🇨🇳" },
  { code: "es", label: "Spanish",     native: "Español",      tts: "es-ES", flag: "🇪🇸" },
  { code: "fr", label: "French",      native: "Français",     tts: "fr-FR", flag: "🇫🇷" },
  { code: "de", label: "German",      native: "Deutsch",      tts: "de-DE", flag: "🇩🇪" },
  { code: "ja", label: "Japanese",    native: "日本語",        tts: "ja-JP", flag: "🇯🇵" },
  { code: "ko", label: "Korean",      native: "한국어",        tts: "ko-KR", flag: "🇰🇷" },
  { code: "vi", label: "Vietnamese",  native: "Tiếng Việt",   tts: "vi-VN", flag: "🇻🇳" },
  { code: "pt", label: "Portuguese",  native: "Português",    tts: "pt-BR", flag: "🇧🇷" },
  { code: "it", label: "Italian",     native: "Italiano",     tts: "it-IT", flag: "🇮🇹" },
];

/* UI dictionary. Key → { en, zh, es, fr, de, ja, ko, vi, pt, it } */
const PP_I18N = {
  "nav.learn":    { en:"Learn", zh:"学习", es:"Aprender", fr:"Apprendre", de:"Lernen", ja:"学ぶ", ko:"학습", vi:"Học", pt:"Aprender", it:"Impara" },
  "nav.songs":    { en:"Songs", zh:"歌曲", es:"Canciones", fr:"Chansons", de:"Lieder", ja:"曲", ko:"노래", vi:"Bài hát", pt:"Músicas", it:"Brani" },
  "nav.practice": { en:"Practice", zh:"练习", es:"Practicar", fr:"S'exercer", de:"Üben", ja:"練習", ko:"연습", vi:"Luyện tập", pt:"Praticar", it:"Esercìzi" },
  "nav.profile":  { en:"Profile", zh:"个人", es:"Perfil", fr:"Profil", de:"Profil", ja:"プロフィール", ko:"프로필", vi:"Hồ sơ", pt:"Perfil", it:"Profilo" },
  "nav.settings": { en:"Settings", zh:"设置", es:"Ajustes", fr:"Réglages", de:"Einst.", ja:"設定", ko:"설정", vi:"Cài đặt", pt:"Ajustes", it:"Imposta" },

  "home.hi":      { en:"Hi", zh:"你好", es:"Hola", fr:"Salut", de:"Hallo", ja:"こんにちは", ko:"안녕", vi:"Chào", pt:"Olá", it:"Ciao" },
  "home.ready":   { en:"Ready to jam?", zh:"准备开整了吗？", es:"¿Le damos?", fr:"On se lance ?", de:"Bock auf Tasten?", ja:"弾いちゃう？", ko:"건반 한판 갈까?", vi:"Quẩy phím chưa?", pt:"Bora tocar?", it:"Si pesta?" },
  "home.continueLearning": { en:"Continue learning", zh:"继续学习", es:"Seguir aprendiendo", fr:"Continuer", de:"Weiterlernen", ja:"学習を続ける", ko:"이어서 학습", vi:"Tiếp tục học", pt:"Continuar", it:"Continua" },
  "home.continue": { en:"Continue", zh:"继续", es:"Continuar", fr:"Continuer", de:"Weiter", ja:"続ける", ko:"계속", vi:"Tiếp tục", pt:"Continuar", it:"Continua" },
  "home.dailyGoal":{ en:"Daily goal", zh:"每日目标", es:"Meta diaria", fr:"Objectif du jour", de:"Tagesziel", ja:"今日の目標", ko:"오늘의 목표", vi:"Mục tiêu hôm nay", pt:"Meta diária", it:"Obiettivo" },
  "home.lessonOf":{ en:"Lesson 3 of 8", zh:"第 3 课 / 共 8 课", es:"Lección 3 de 8", fr:"Leçon 3 sur 8", de:"Lektion 3 von 8", ja:"レッスン 3 / 8", ko:"3 / 8 레슨", vi:"Bài 3 / 8", pt:"Lição 3 de 8", it:"Lezione 3 di 8" },

  "who.title":    { en:"Who's on the keys?", zh:"今天谁来弹？", es:"¿Quién toca hoy?", fr:"Qui est aux touches ?", de:"Wer ist an den Tasten?", ja:"今日はだれが弾く？", ko:"오늘은 누가 칠까?", vi:"Hôm nay ai chơi?", pt:"Quem tá nas teclas?", it:"Chi è alle tastiere?" },
  "who.subtitle": { en:"Everyone gets their own streak, XP & bragging rights.", zh:"每个人都有自己的连胜、经验，还有炫耀的资本。", es:"Cada quien con su racha, XP y derecho a presumir.", fr:"Chacun sa série, ses XP et son droit de frimer.", de:"Jeder hat eigene Serie, XP und Angeberrechte.", ja:"一人ひとりに連続記録・XP・自慢する権利つき。", ko:"각자 연속 기록, XP, 그리고 자랑할 권리까지.", vi:"Mỗi người có chuỗi, XP và quyền flex riêng.", pt:"Cada um com sua sequência, XP e direito de se gabar.", it:"Ognuno ha la sua serie, XP e diritto di vantarsi." },
  "who.add":      { en:"Add", zh:"添加", es:"Añadir", fr:"Ajouter", de:"Hinzu", ja:"追加", ko:"추가", vi:"Thêm", pt:"Adicionar", it:"Aggiungi" },
  "who.manage":   { en:"Manage", zh:"管理", es:"Gestionar", fr:"Gérer", de:"Verwalten", ja:"管理", ko:"관리", vi:"Quản lý", pt:"Gerir", it:"Gestisci" },
  "who.done":     { en:"Done", zh:"完成", es:"Listo", fr:"Terminé", de:"Fertig", ja:"完了", ko:"완료", vi:"Xong", pt:"Pronto", it:"Fatto" },

  "common.gotIt": { en:"Got it", zh:"明白了", es:"Entendido", fr:"Compris", de:"Verstanden", ja:"わかった", ko:"알겠어요", vi:"Hiểu rồi", pt:"Entendi", it:"Capito" },
  "common.next":  { en:"Next", zh:"下一步", es:"Siguiente", fr:"Suivant", de:"Weiter", ja:"次へ", ko:"다음", vi:"Tiếp", pt:"Próximo", it:"Avanti" },
  "common.start": { en:"Start", zh:"开始", es:"Empezar", fr:"Commencer", de:"Start", ja:"開始", ko:"시작", vi:"Bắt đầu", pt:"Começar", it:"Inizia" },
  "common.save":  { en:"Save", zh:"保存", es:"Guardar", fr:"Enregistrer", de:"Speichern", ja:"保存", ko:"저장", vi:"Lưu", pt:"Salvar", it:"Salva" },
  "common.skip":  { en:"Skip", zh:"跳过", es:"Saltar", fr:"Passer", de:"Überspringen", ja:"スキップ", ko:"건너뛰기", vi:"Bỏ qua", pt:"Pular", it:"Salta" },
  "common.tryAgain": { en:"Try again", zh:"再试一次", es:"Reintentar", fr:"Réessayer", de:"Nochmal", ja:"もう一度", ko:"다시 시도", vi:"Thử lại", pt:"Tentar de novo", it:"Riprova" },
  "common.startLearning": { en:"Start learning", zh:"开始学习", es:"Empezar a aprender", fr:"Commencer à apprendre", de:"Loslernen", ja:"学習を始める", ko:"학습 시작", vi:"Bắt đầu học", pt:"Começar a aprender", it:"Inizia a imparare" },
  "pair.keysLight": { en:"Your keys light up! ✨", zh:"你的琴键亮起来了！✨", es:"¡Tus teclas se iluminan! ✨", fr:"Tes touches s'allument ! ✨", de:"Deine Tasten leuchten! ✨", ja:"鍵盤が光るよ！✨", ko:"건반에 불이 들어와요! ✨", vi:"Phím đàn của bạn sáng lên! ✨", pt:"Suas teclas acendem! ✨", it:"I tuoi tasti si illuminano! ✨" },
  "pair.magic": { en:"Watch the strip — the magic is real.", zh:"看看灯带 — 魔法是真的。", es:"Mira la tira: la magia es real.", fr:"Regarde le bandeau — la magie opère.", de:"Sieh dir die Leiste an — echte Magie.", ja:"ライトを見て — 本物の魔法だよ。", ko:"스트립을 보세요 — 진짜 마법이에요.", vi:"Nhìn dải đèn — phép màu có thật.", pt:"Veja a fita — a mágica é real.", it:"Guarda la striscia — la magia è reale." },
  "pair.ledSettings": { en:"LED settings", zh:"LED 设置", es:"Ajustes LED", fr:"Réglages LED", de:"LED-Einstellungen", ja:"LED設定", ko:"LED 설정", vi:"Cài đặt LED", pt:"Ajustes LED", it:"Impostazioni LED" },

  "lesson.hearAgain": { en:"Hear it again", zh:"再听一次", es:"Escuchar otra vez", fr:"Réécouter", de:"Nochmal hören", ja:"もう一度聞く", ko:"다시 듣기", vi:"Nghe lại", pt:"Ouvir de novo", it:"Riascolta" },
  "lesson.ledOn":  { en:"LED strip lit", zh:"LED 灯亮起", es:"Tira LED encendida", fr:"Bandeau LED allumé", de:"LED-Leiste an", ja:"LEDライト点灯", ko:"LED 켜짐", vi:"Đèn LED đang sáng", pt:"Fita LED acesa", it:"Striscia LED accesa" },
  "lesson.ledOff": { en:"LED off — keys on screen", zh:"LED 关闭 — 看屏幕琴键", es:"LED apagado — teclas en pantalla", fr:"LED éteint — touches à l'écran", de:"LED aus — Tasten am Display", ja:"LEDオフ — 画面の鍵盤", ko:"LED 꺼짐 — 화면 건반", vi:"LED tắt — phím trên màn hình", pt:"LED desligado — teclas na tela", it:"LED spento — tasti a schermo" },
  "lesson.perfect": { en:"Nailed it! 🎉", zh:"完美通关！🎉", es:"¡Crack total! 🎉", fr:"Trop fort ! 🎉", de:"Sitzt perfekt! 🎉", ja:"神プレイ！🎉", ko:"완벽 그 자체! 🎉", vi:"Đỉnh của chóp! 🎉", pt:"Arrasou! 🎉", it:"Spaccato tutto! 🎉" },
  "lesson.notQuite": { en:"So close — chase the glowing keys!", zh:"就差一点 — 跟着发光的琴键冲！", es:"Por poco — ¡persigue las teclas que brillan!", fr:"Presque — suis les touches qui brillent !", de:"Fast — jag den leuchtenden Tasten hinterher!", ja:"おしい！光ってる鍵盤を追いかけて！", ko:"아쉽다! 빛나는 건반을 따라가 봐!", vi:"Suýt rồi — bám theo phím sáng nào!", pt:"Quase lá — vai atrás das teclas que brilham!", it:"Ci sei quasi — segui i tasti che brillano!" },

  "complete.title": { en:"Lesson complete", zh:"课程完成", es:"Lección completada", fr:"Leçon terminée", de:"Lektion fertig", ja:"レッスン完了", ko:"레슨 완료", vi:"Hoàn thành bài học", pt:"Lição concluída", it:"Lezione completata" },
  "complete.xp":    { en:"XP", zh:"经验", es:"XP", fr:"XP", de:"XP", ja:"XP", ko:"XP", vi:"XP", pt:"XP", it:"XP" },
  "complete.streak":{ en:"Streak", zh:"连胜", es:"Racha", fr:"Série", de:"Serie", ja:"連続", ko:"연속", vi:"Chuỗi", pt:"Sequência", it:"Serie" },
  "complete.accuracy":{ en:"Accuracy", zh:"准确率", es:"Precisión", fr:"Précision", de:"Genauigk.", ja:"正確さ", ko:"정확도", vi:"Độ chính xác", pt:"Precisão", it:"Precisione" },
  "complete.nextLesson": { en:"Next lesson", zh:"下一课", es:"Siguiente lección", fr:"Leçon suivante", de:"Nächste Lektion", ja:"次のレッスン", ko:"다음 레슨", vi:"Bài tiếp theo", pt:"Próxima lição", it:"Prossima lezione" },
  "complete.backToLearn": { en:"Back to learn", zh:"返回学习", es:"Volver", fr:"Retour", de:"Zurück", ja:"学習に戻る", ko:"학습으로", vi:"Về phần học", pt:"Voltar", it:"Torna" },

  "songs.title":   { en:"Songbook", zh:"歌曲库", es:"Cancionero", fr:"Répertoire", de:"Liederbuch", ja:"ソングブック", ko:"송북", vi:"Tuyển tập", pt:"Cancioneiro", it:"Canzoniere" },
  "songs.trending":{ en:"Blowing up right now", zh:"正在爆火", es:"Petándolo ahora", fr:"Ça cartonne là", de:"Gerade voll angesagt", ja:"今バズってる", ko:"지금 핫한 곡", vi:"Đang gây sốt", pt:"Bombando agora", it:"Spaccano ora" },
  "songs.learn":   { en:"Songs you'll learn", zh:"你将学会的歌", es:"Canciones que aprenderás", fr:"Chansons à apprendre", de:"Lieder zum Lernen", ja:"これから学ぶ曲", ko:"배울 노래", vi:"Bài bạn sẽ học", pt:"Músicas para aprender", it:"Brani da imparare" },
  "songs.featured":{ en:"Featured", zh:"精选", es:"Destacada", fr:"À la une", de:"Empfohlen", ja:"おすすめ", ko:"추천", vi:"Nổi bật", pt:"Destaque", it:"In evidenza" },

  "settings.title":    { en:"Settings", zh:"设置", es:"Ajustes", fr:"Réglages", de:"Einstellungen", ja:"設定", ko:"설정", vi:"Cài đặt", pt:"Ajustes", it:"Impostazioni" },
  "settings.tune":     { en:"Make it yours.", zh:"调成你喜欢的样子。", es:"Hazlo a tu manera.", fr:"Fais-en ton truc.", de:"Mach's zu deinem.", ja:"きみ好みにしよう。", ko:"네 취향대로 맞춰 봐.", vi:"Chỉnh theo ý bạn.", pt:"Deixe do seu jeito.", it:"Fallo a modo tuo." },
  "settings.language": { en:"Language", zh:"语言", es:"Idioma", fr:"Langue", de:"Sprache", ja:"言語", ko:"언어", vi:"Ngôn ngữ", pt:"Idioma", it:"Lingua" },
  "settings.langSub":  { en:"App & instructor voice", zh:"应用与教练语音", es:"App y voz del instructor", fr:"App et voix du prof", de:"App & Lehrerstimme", ja:"アプリと講師の声", ko:"앱 & 강사 음성", vi:"Ứng dụng & giọng giảng", pt:"App e voz do instrutor", it:"App e voce del maestro" },
  "settings.dailyGoal":{ en:"Daily goal", zh:"每日目标", es:"Meta diaria", fr:"Objectif du jour", de:"Tagesziel", ja:"今日の目標", ko:"오늘의 목표", vi:"Mục tiêu hôm nay", pt:"Meta diária", it:"Obiettivo giornaliero" },
  "settings.voice":    { en:"Maestro voice", zh:"Maestro 语音", es:"Voz de Maestro", fr:"Voix de Maestro", de:"Maestro-Stimme", ja:"マエストロの声", ko:"마에스트로 음성", vi:"Giọng Maestro", pt:"Voz do Maestro", it:"Voce di Maestro" },
  "settings.bgMusic":  { en:"Background music", zh:"背景音乐", es:"Música de fondo", fr:"Musique de fond", de:"Hintergrundmusik", ja:"BGM", ko:"배경 음악", vi:"Nhạc nền", pt:"Música de fundo", it:"Musica di sottofondo" },
  "settings.reminders":{ en:"Reminders", zh:"提醒", es:"Recordatorios", fr:"Rappels", de:"Erinnerungen", ja:"リマインダー", ko:"알림", vi:"Nhắc nhở", pt:"Lembretes", it:"Promemoria" },
  "settings.lessonSound": { en:"Lesson & sound", zh:"课程与声音", es:"Lección y sonido", fr:"Leçon et son", de:"Lektion & Ton", ja:"レッスンと音", ko:"레슨 & 사운드", vi:"Bài học & âm thanh", pt:"Lição e som", it:"Lezione e suono" },
  "settings.hardware": { en:"Hardware", zh:"硬件", es:"Hardware", fr:"Matériel", de:"Hardware", ja:"ハードウェア", ko:"하드웨어", vi:"Phần cứng", pt:"Hardware", it:"Hardware" },
  "settings.account":  { en:"Account", zh:"账户", es:"Cuenta", fr:"Compte", de:"Konto", ja:"アカウント", ko:"계정", vi:"Tài khoản", pt:"Conta", it:"Account" },
  "settings.subscription": { en:"Subscription", zh:"订阅", es:"Suscripción", fr:"Abonnement", de:"Abo", ja:"サブスク", ko:"구독", vi:"Gói đăng ký", pt:"Assinatura", it:"Abbonamento" },
  "settings.switchProfile": { en:"Switch profile", zh:"切换用户", es:"Cambiar perfil", fr:"Changer de profil", de:"Profil wechseln", ja:"プロフィール切替", ko:"프로필 전환", vi:"Đổi hồ sơ", pt:"Trocar perfil", it:"Cambia profilo" },

  "profile.title": { en:"Profile", zh:"个人资料", es:"Perfil", fr:"Profil", de:"Profil", ja:"プロフィール", ko:"프로필", vi:"Hồ sơ", pt:"Perfil", it:"Profilo" },
  "profile.edit":  { en:"Edit", zh:"编辑", es:"Editar", fr:"Modifier", de:"Bearb.", ja:"編集", ko:"편집", vi:"Sửa", pt:"Editar", it:"Modifica" },
  "profile.switch":{ en:"Switch", zh:"切换", es:"Cambiar", fr:"Changer", de:"Wechseln", ja:"切替", ko:"전환", vi:"Đổi", pt:"Trocar", it:"Cambia" },
  "profile.thisWeek": { en:"This week", zh:"本周", es:"Esta semana", fr:"Cette semaine", de:"Diese Woche", ja:"今週", ko:"이번 주", vi:"Tuần này", pt:"Esta semana", it:"Questa settimana" },
  "profile.achievements": { en:"Achievements", zh:"成就", es:"Logros", fr:"Réussites", de:"Erfolge", ja:"実績", ko:"업적", vi:"Thành tích", pt:"Conquistas", it:"Obiettivi" },

  "create.title":   { en:"Create profile", zh:"创建用户", es:"Crear perfil", fr:"Créer un profil", de:"Profil erstellen", ja:"プロフィール作成", ko:"프로필 만들기", vi:"Tạo hồ sơ", pt:"Criar perfil", it:"Crea profilo" },
  "create.edit":    { en:"Edit profile", zh:"编辑用户", es:"Editar perfil", fr:"Modifier le profil", de:"Profil bearbeiten", ja:"プロフィール編集", ko:"프로필 편집", vi:"Sửa hồ sơ", pt:"Editar perfil", it:"Modifica profilo" },
  "create.firstName": { en:"First name", zh:"名字", es:"Nombre", fr:"Prénom", de:"Vorname", ja:"名前", ko:"이름", vi:"Tên", pt:"Nome", it:"Nome" },
  "create.pickMaestro": { en:"Pick a Maestro", zh:"选择一个 Maestro", es:"Elige un Maestro", fr:"Choisis un Maestro", de:"Wähle einen Maestro", ja:"マエストロを選ぶ", ko:"마에스트로 선택", vi:"Chọn một Maestro", pt:"Escolha um Maestro", it:"Scegli un Maestro" },
  "create.create":  { en:"Create profile", zh:"创建用户", es:"Crear perfil", fr:"Créer le profil", de:"Profil erstellen", ja:"作成する", ko:"만들기", vi:"Tạo hồ sơ", pt:"Criar perfil", it:"Crea profilo" },

  "paywall.title": { en:"Go Premium,\nlevel up faster.", zh:"升级会员，\n开挂式进步。", es:"Hazte Premium,\nsube de nivel ya.", fr:"Passe Premium,\nprogresse à fond.", de:"Hol dir Premium,\nlevel schneller hoch.", ja:"プレミアムで\n一気にレベルアップ。", ko:"프리미엄으로\n초고속 레벨업.", vi:"Lên Premium,\nlên trình nhanh hơn.", pt:"Seja Premium,\nsuba de nível mais rápido.", it:"Passa a Premium,\nsali di livello più in fretta." },
};

/* Country leaderboard charts — real charting titles (NOT translated). */
const PP_CHARTS = {
  en: [ {title:"Perfect",artist:"Ed Sheeran",hue:12}, {title:"Anti-Hero",artist:"Taylor Swift",hue:330}, {title:"A Thousand Years",artist:"Christina Perri",hue:280}, {title:"Clocks",artist:"Coldplay",hue:200,premium:true}, {title:"Someone Like You",artist:"Adele",hue:320,premium:true} ],
  zh: [ {title:"晴天",artist:"周杰伦 Jay Chou",hue:200}, {title:"月亮代表我的心",artist:"邓丽君 Teresa Teng",hue:320}, {title:"童话",artist:"光良 Michael Wong",hue:280}, {title:"七里香",artist:"周杰伦 Jay Chou",hue:90,premium:true}, {title:"演员",artist:"薛之谦 Joker Xue",hue:20,premium:true} ],
  es: [ {title:"Despacito",artist:"Luis Fonsi",hue:160}, {title:"Bailando",artist:"Enrique Iglesias",hue:30}, {title:"La Bamba",artist:"Ritchie Valens",hue:50}, {title:"Vivir Mi Vida",artist:"Marc Anthony",hue:10,premium:true}, {title:"Color Esperanza",artist:"Diego Torres",hue:120,premium:true} ],
  fr: [ {title:"La Vie en rose",artist:"Édith Piaf",hue:330}, {title:"Dernière danse",artist:"Indila",hue:270}, {title:"Formidable",artist:"Stromae",hue:200}, {title:"Non, je ne regrette rien",artist:"Édith Piaf",hue:350,premium:true}, {title:"Comme d'habitude",artist:"Claude François",hue:40,premium:true} ],
  de: [ {title:"99 Luftballons",artist:"Nena",hue:0}, {title:"Atemlos",artist:"Helene Fischer",hue:300}, {title:"Für Elise",artist:"Beethoven",hue:240}, {title:"Auf uns",artist:"Andreas Bourani",hue:40,premium:true}, {title:"Major Tom",artist:"Peter Schilling",hue:210,premium:true} ],
  ja: [ {title:"残酷な天使のテーゼ",artist:"高橋洋子",hue:350}, {title:"Lemon",artist:"米津玄師 Kenshi Yonezu",hue:55}, {title:"紅蓮華",artist:"LiSA",hue:10}, {title:"千本桜",artist:"黒うさP",hue:330,premium:true}, {title:"涙そうそう",artist:"夏川りみ",hue:200,premium:true} ],
  ko: [ {title:"봄날 (Spring Day)",artist:"BTS",hue:200}, {title:"좋은 날 (Good Day)",artist:"IU",hue:330}, {title:"밤편지 (Through the Night)",artist:"IU",hue:260}, {title:"신호등 (Traffic Light)",artist:"이무진 Lee Mujin",hue:50,premium:true}, {title:"Dynamite",artist:"BTS",hue:30,premium:true} ],
  vi: [ {title:"Em Của Ngày Hôm Qua",artist:"Sơn Tùng M-TP",hue:200}, {title:"Lạc Trôi",artist:"Sơn Tùng M-TP",hue:280}, {title:"Để Mị Nói Cho Mà Nghe",artist:"Hoàng Thùy Linh",hue:20}, {title:"Nơi Này Có Anh",artist:"Sơn Tùng M-TP",hue:330,premium:true}, {title:"Hãy Trao Cho Anh",artist:"Sơn Tùng M-TP",hue:160,premium:true} ],
  pt: [ {title:"Garota de Ipanema",artist:"Tom Jobim",hue:160}, {title:"Evidências",artist:"Chitãozinho & Xororó",hue:330}, {title:"Ai Se Eu Te Pego",artist:"Michel Teló",hue:30}, {title:"Aquarela",artist:"Toquinho",hue:200,premium:true}, {title:"Trem das Onze",artist:"Adoniran Barbosa",hue:50,premium:true} ],
  it: [ {title:"Volare",artist:"Domenico Modugno",hue:210}, {title:"Con te partirò",artist:"Andrea Bocelli",hue:280}, {title:"Bella Ciao",artist:"Traditional",hue:0}, {title:"L'italiano",artist:"Toto Cutugno",hue:120,premium:true}, {title:"Caruso",artist:"Lucio Dalla",hue:330,premium:true} ],
};
PP_CHARTS.en.forEach((s,i)=>s.id="ch_en"+i);
Object.keys(PP_CHARTS).forEach(k=>PP_CHARTS[k].forEach((s,i)=>{s.id="ch_"+k+i; s.level="Elementary";}));

/* Localized lesson narration (Pop Chords I — C major). */
const PP_LESSON_I18N = {
  step0: { en:"Let's learn the C major chord. Place your thumb on C.", zh:"我们来学 C 大三和弦。把拇指放在 C 上。", es:"Aprendamos el acorde de Do mayor. Pon el pulgar en Do.", fr:"Apprenons l'accord de Do majeur. Pose ton pouce sur Do.", de:"Lernen wir den C-Dur-Akkord. Leg den Daumen auf das C.", ja:"Cメジャーコードを学ぼう。親指をCに置いてね。", ko:"다장조 코드를 배워요. 엄지를 도(C)에 올려요.", vi:"Cùng học hợp âm Đô trưởng. Đặt ngón cái lên nốt Đô.", pt:"Vamos aprender o acorde de Dó maior. Ponha o polegar no Dó.", it:"Impariamo l'accordo di Do maggiore. Metti il pollice sul Do." },
  step1: { en:"Press the glowing C key.", zh:"按下发光的 C 键。", es:"Pulsa la tecla Do iluminada.", fr:"Appuie sur la touche Do lumineuse.", de:"Drück die leuchtende C-Taste.", ja:"光っているCの鍵盤を押して。", ko:"빛나는 도(C) 건반을 눌러요.", vi:"Nhấn phím Đô đang sáng.", pt:"Toque a tecla Dó iluminada.", it:"Premi il tasto Do illuminato." },
  step2: { en:"A C chord is C, E and G played together.", zh:"C 和弦由 C、E、G 一起弹奏。", es:"El acorde de Do es Do, Mi y Sol juntos.", fr:"L'accord de Do, c'est Do, Mi et Sol ensemble.", de:"Ein C-Akkord ist C, E und G zusammen.", ja:"Cコードは C・E・G を一緒に弾くよ。", ko:"도 코드는 도·미·솔을 함께 눌러요.", vi:"Hợp âm Đô gồm Đô, Mi và Sol cùng lúc.", pt:"O acorde de Dó é Dó, Mi e Sol juntos.", it:"L'accordo di Do è Do, Mi e Sol insieme." },
  step3: { en:"Press all three glowing keys.", zh:"按下全部三个发光的键。", es:"Pulsa las tres teclas iluminadas.", fr:"Appuie sur les trois touches lumineuses.", de:"Drück alle drei leuchtenden Tasten.", ja:"光る3つの鍵盤を押して。", ko:"빛나는 세 건반을 모두 눌러요.", vi:"Nhấn cả ba phím đang sáng.", pt:"Toque as três teclas iluminadas.", it:"Premi tutti e tre i tasti illuminati." },
  step4: { en:"Now G major: G, B and D. Slide your hand up.", zh:"现在是 G 大三和弦：G、B、D。把手向上移。", es:"Ahora Sol mayor: Sol, Si y Re. Desliza la mano.", fr:"Maintenant Sol majeur : Sol, Si et Ré. Glisse la main.", de:"Jetzt G-Dur: G, H und D. Schieb die Hand hoch.", ja:"次はGメジャー：G・B・D。手を上へ。", ko:"이제 사장조: 솔·시·레. 손을 위로 옮겨요.", vi:"Giờ là Sol trưởng: Sol, Si, Rê. Trượt tay lên.", pt:"Agora Sol maior: Sol, Si e Ré. Deslize a mão.", it:"Ora Sol maggiore: Sol, Si e Re. Sposta la mano." },
  step5: { en:"Press the glowing keys.", zh:"按下发光的琴键。", es:"Pulsa las teclas iluminadas.", fr:"Appuie sur les touches lumineuses.", de:"Drück die leuchtenden Tasten.", ja:"光る鍵盤を押して。", ko:"빛나는 건반을 눌러요.", vi:"Nhấn các phím đang sáng.", pt:"Toque as teclas iluminadas.", it:"Premi i tasti illuminati." },
  step6: { en:"Play C chord, then G chord.", zh:"先弹 C 和弦，再弹 G 和弦。", es:"Toca el acorde de Do y luego el de Sol.", fr:"Joue l'accord de Do, puis celui de Sol.", de:"Spiel C-Akkord, dann G-Akkord.", ja:"Cコード、それからGコードを弾いて。", ko:"도 코드를 치고, 그다음 솔 코드를 쳐요.", vi:"Chơi hợp âm Đô, rồi hợp âm Sol.", pt:"Toque o acorde de Dó e depois o de Sol.", it:"Suona l'accordo di Do, poi quello di Sol." },
  prompt_playC: { en:"Play C", zh:"弹 C", es:"Toca Do", fr:"Joue Do", de:"Spiel C", ja:"Cを弾く", ko:"도 치기", vi:"Chơi Đô", pt:"Toque Dó", it:"Suona Do" },
  prompt_cChord: { en:"Play the C chord", zh:"弹 C 和弦", es:"Toca el acorde de Do", fr:"Joue l'accord de Do", de:"Spiel den C-Akkord", ja:"Cコードを弾く", ko:"도 코드 치기", vi:"Chơi hợp âm Đô", pt:"Toque o acorde de Dó", it:"Suona l'accordo di Do" },
  prompt_gChord: { en:"Play the G chord", zh:"弹 G 和弦", es:"Toca el acorde de Sol", fr:"Joue l'accord de Sol", de:"Spiel den G-Akkord", ja:"Gコードを弾く", ko:"솔 코드 치기", vi:"Chơi hợp âm Sol", pt:"Toque o acorde de Sol", it:"Suona l'accordo di Sol" },
  prompt_switch: { en:"Switch: C then G", zh:"切换：先 C 后 G", es:"Cambia: Do y luego Sol", fr:"Enchaîne : Do puis Sol", de:"Wechsel: C dann G", ja:"切替：C から G", ko:"전환: 도 다음 솔", vi:"Đổi: Đô rồi Sol", pt:"Troque: Dó e depois Sol", it:"Cambia: Do poi Sol" },
};

function t(key, lang) {
  const e = PP_I18N[key];
  if (!e) return key;
  return e[lang] || e.en || key;
}
function tLesson(key, lang) {
  const e = PP_LESSON_I18N[key];
  if (!e) return "";
  return e[lang] || e.en || "";
}
function langTTS(lang) { const l = PP_LANGS.find((x) => x.code === lang); return l ? l.tts : "en-US"; }

/* Levels, grade word, kinds, goal labels, settings rows, card states. */
const PP_I18N_2 = {
  "grade": { en:"Grade", zh:"级", es:"Grado", fr:"Niveau", de:"Stufe", ja:"グレード", ko:"등급", vi:"Cấp", pt:"Nível", it:"Grado" },
  "level.kg": { en:"Kindergarten", zh:"幼儿园", es:"Preescolar", fr:"Maternelle", de:"Kindergarten", ja:"幼稚園", ko:"유치원", vi:"Mẫu giáo", pt:"Pré-escola", it:"Asilo" },
  "level.el": { en:"Elementary", zh:"小学", es:"Primaria", fr:"Élémentaire", de:"Grundschule", ja:"小学校", ko:"초등", vi:"Tiểu học", pt:"Fundamental I", it:"Elementare" },
  "level.ms": { en:"Middle School", zh:"初中", es:"Secundaria", fr:"Collège", de:"Mittelstufe", ja:"中学校", ko:"중등", vi:"Trung học cơ sở", pt:"Fundamental II", it:"Medie" },
  "level.hs": { en:"High School", zh:"高中", es:"Bachillerato", fr:"Lycée", de:"Oberstufe", ja:"高校", ko:"고등", vi:"Trung học phổ thông", pt:"Ensino Médio", it:"Superiori" },
  "level.un": { en:"University", zh:"大学", es:"Universidad", fr:"Université", de:"Universität", ja:"大学", ko:"대학", vi:"Đại học", pt:"Universidade", it:"Università" },
  "level.ma": { en:"Master", zh:"大师", es:"Maestría", fr:"Maître", de:"Meister", ja:"マスター", ko:"마스터", vi:"Bậc thầy", pt:"Mestre", it:"Maestro" },

  "kind.lesson": { en:"Lesson", zh:"课程", es:"Lección", fr:"Leçon", de:"Lektion", ja:"レッスン", ko:"레슨", vi:"Bài học", pt:"Lição", it:"Lezione" },
  "kind.song": { en:"Song", zh:"歌曲", es:"Canción", fr:"Chanson", de:"Lied", ja:"曲", ko:"노래", vi:"Bài hát", pt:"Música", it:"Brano" },
  "kind.concept": { en:"Concept", zh:"概念", es:"Concepto", fr:"Notion", de:"Konzept", ja:"コンセプト", ko:"개념", vi:"Khái niệm", pt:"Conceito", it:"Concetto" },
  "kind.exercise": { en:"Exercise", zh:"练习", es:"Ejercicio", fr:"Exercice", de:"Übung", ja:"練習", ko:"연습", vi:"Bài tập", pt:"Exercício", it:"Esercizio" },

  "card.continue": { en:"Continue", zh:"继续", es:"Continuar", fr:"Continuer", de:"Weiter", ja:"続ける", ko:"계속하기", vi:"Tiếp tục", pt:"Continuar", it:"Continua" },
  "card.soon": { en:"Still cooking 👨‍🍳 — keep practising!", zh:"还在烤箱里 👨‍🍳 — 先继续练吧！", es:"Aún en el horno 👨‍🍳 — ¡sigue practicando!", fr:"Encore au four 👨‍🍳 — continue à t'entraîner !", de:"Noch im Ofen 👨‍🍳 — üb weiter!", ja:"まだ調理中 👨‍🍳 — 練習続けてね！", ko:"아직 굽는 중 👨‍🍳 — 계속 연습해!", vi:"Đang nấu 👨‍🍳 — cứ luyện tiếp nhé!", pt:"Ainda no forno 👨‍🍳 — continue praticando!", it:"Ancora in forno 👨‍🍳 — continua a esercitarti!" },
  "card.locked": { en:"Beat the step before to crack this open 🔒", zh:"先通关上一步才能解锁这个 🔒", es:"Pasa el paso anterior para abrir este 🔒", fr:"Termine l'étape d'avant pour ouvrir celle-ci 🔒", de:"Knack erst den Schritt davor, dann geht's hier los 🔒", ja:"前のステップをクリアで解放！🔒", ko:"앞 단계를 깨야 이게 열려요 🔒", vi:"Qua bước trước đã rồi mở khoá cái này 🔒", pt:"Passe a etapa anterior pra abrir esta 🔒", it:"Supera lo step prima per sbloccare questo 🔒" },

  "goal.casual": { en:"Casual", zh:"轻松", es:"Relajado", fr:"Tranquille", de:"Locker", ja:"気軽", ko:"가볍게", vi:"Thư giãn", pt:"Leve", it:"Soft" },
  "goal.regular": { en:"Regular", zh:"常规", es:"Normal", fr:"Régulier", de:"Normal", ja:"標準", ko:"보통", vi:"Đều đặn", pt:"Normal", it:"Normale" },
  "goal.serious": { en:"Serious", zh:"认真", es:"En serio", fr:"Sérieux", de:"Ehrgeizig", ja:"本気", ko:"진지하게", vi:"Nghiêm túc", pt:"Sério", it:"Serio" },
  "goal.intense": { en:"Intense", zh:"高强度", es:"Intenso", fr:"Intense", de:"Intensiv", ja:"集中", ko:"몰입", vi:"Cường độ cao", pt:"Intenso", it:"Intenso" },

  "set.ledStrip": { en:"LED strip", zh:"LED 灯带", es:"Tira LED", fr:"Bandeau LED", de:"LED-Leiste", ja:"LEDストリップ", ko:"LED 스트립", vi:"Dải đèn LED", pt:"Fita LED", it:"Striscia LED" },
  "set.ledThemes": { en:"LED themes & brightness", zh:"LED 主题与亮度", es:"Temas y brillo LED", fr:"Thèmes et luminosité LED", de:"LED-Themen & Helligkeit", ja:"LEDテーマと明るさ", ko:"LED 테마 & 밝기", vi:"Chủ đề & độ sáng LED", pt:"Temas e brilho LED", it:"Temi e luminosità LED" },
  "set.ledThemesShort": { en:"LED themes", zh:"LED 主题", es:"Temas LED", fr:"Thèmes LED", de:"LED-Themen", ja:"LEDテーマ", ko:"LED 테마", vi:"Chủ đề LED", pt:"Temas LED", it:"Temi LED" },
  "set.recalibrate": { en:"Re-calibrate", zh:"重新校准", es:"Recalibrar", fr:"Recalibrer", de:"Neu kalibrieren", ja:"再キャリブレーション", ko:"재보정", vi:"Hiệu chỉnh lại", pt:"Recalibrar", it:"Ricalibra" },
  "set.recalibrateSub": { en:"Align strip & test keys", zh:"对齐灯带并测试琴键", es:"Alinea la tira y prueba teclas", fr:"Aligne le bandeau et teste les touches", de:"Leiste ausrichten & Tasten testen", ja:"ストリップを合わせて鍵盤を確認", ko:"스트립 정렬 & 건반 테스트", vi:"Căn dải & kiểm tra phím", pt:"Alinhe a fita e teste as teclas", it:"Allinea la striscia e prova i tasti" },
  "set.connected": { en:"Connected", zh:"已连接", es:"Conectado", fr:"Connecté", de:"Verbunden", ja:"接続済み", ko:"연결됨", vi:"Đã kết nối", pt:"Conectado", it:"Connesso" },
  "set.notConnected": { en:"Not connected", zh:"未连接", es:"Sin conexión", fr:"Non connecté", de:"Nicht verbunden", ja:"未接続", ko:"연결 안 됨", vi:"Chưa kết nối", pt:"Sem conexão", it:"Non connesso" },
  "set.cloudSync": { en:"Cloud sync", zh:"云同步", es:"Sincronización", fr:"Synchro cloud", de:"Cloud-Sync", ja:"クラウド同期", ko:"클라우드 동기화", vi:"Đồng bộ đám mây", pt:"Sincronização", it:"Sincron. cloud" },
  "set.cloudSub": { en:"One subscription, all devices", zh:"一个订阅，所有设备", es:"Una suscripción, todos los dispositivos", fr:"Un abonnement, tous les appareils", de:"Ein Abo, alle Geräte", ja:"1つのサブで全デバイス", ko:"구독 하나로 모든 기기", vi:"Một gói, mọi thiết bị", pt:"Uma assinatura, todos os aparelhos", it:"Un abbonamento, tutti i dispositivi" },
  "set.free": { en:"Free plan", zh:"免费版", es:"Plan gratis", fr:"Offre gratuite", de:"Gratis-Plan", ja:"無料プラン", ko:"무료 플랜", vi:"Gói miễn phí", pt:"Plano grátis", it:"Piano gratis" },
  "set.playingAs": { en:"Playing as", zh:"当前用户", es:"Jugando como", fr:"Profil actif", de:"Spielt als", ja:"プレイ中", ko:"플레이 중", vi:"Đang chơi", pt:"Jogando como", it:"Stai giocando come" },
  "set.familyAnnual": { en:"Family · Annual", zh:"家庭版 · 年付", es:"Familia · Anual", fr:"Famille · Annuel", de:"Familie · Jährlich", ja:"ファミリー · 年額", ko:"패밀리 · 연간", vi:"Gia đình · Hàng năm", pt:"Família · Anual", it:"Famiglia · Annuale" },

  "song.learnThis": { en:"Learn this song", zh:"学这首歌", es:"Aprender esta canción", fr:"Apprendre ce morceau", de:"Dieses Lied lernen", ja:"この曲を学ぶ", ko:"이 곡 배우기", vi:"Học bài này", pt:"Aprender esta música", it:"Impara questo brano" },
  "song.hearIt": { en:"Hear it", zh:"试听", es:"Escuchar", fr:"Écouter", de:"Anhören", ja:"聴く", ko:"들어보기", vi:"Nghe thử", pt:"Ouvir", it:"Ascolta" },
  "song.play": { en:"Play song", zh:"播放", es:"Reproducir", fr:"Lire", de:"Abspielen", ja:"再生", ko:"재생", vi:"Phát", pt:"Tocar", it:"Riproduci" },
  "song.import": { en:"Import sheet", zh:"导入乐谱", es:"Importar partitura", fr:"Importer partition", de:"Noten importieren", ja:"楽譜を取込", ko:"악보 가져오기", vi:"Nhập bản nhạc", pt:"Importar partitura", it:"Importa spartito" },
  "preview.unlock": { en:"Unlock & play", zh:"解锁播放", es:"Desbloquear y tocar", fr:"Débloquer et jouer", de:"Freischalten & spielen", ja:"解除して再生", ko:"잠금 해제 후 재생", vi:"Mở khoá & chơi", pt:"Desbloquear e tocar", it:"Sblocca e suona" },
  "preview.chart": { en:"Chord chart", zh:"和弦谱", es:"Cifrado de acordes", fr:"Grille d'accords", de:"Akkordtabelle", ja:"コード譜", ko:"코드 차트", vi:"Bảng hợp âm", pt:"Cifra", it:"Griglia accordi" },
  "preview.premiumNote": { en:"This song is part of Premium.", zh:"这首歌是会员专属。", es:"Esta canción es parte de Premium.", fr:"Ce morceau fait partie de Premium.", de:"Dieser Song gehört zu Premium.", ja:"この曲はプレミアム限定です。", ko:"이 곡은 프리미엄 전용이에요.", vi:"Bài này thuộc gói Premium.", pt:"Esta música faz parte do Premium.", it:"Questo brano è incluso in Premium." },
  "import.title": { en:"Import sheet music", zh:"导入乐谱", es:"Importar partitura", fr:"Importer une partition", de:"Noten importieren", ja:"楽譜を取り込む", ko:"악보 가져오기", vi:"Nhập bản nhạc", pt:"Importar partitura", it:"Importa spartito" },
  "import.photo": { en:"Take a photo", zh:"拍照", es:"Tomar una foto", fr:"Prendre une photo", de:"Foto aufnehmen", ja:"写真を撮る", ko:"사진 찍기", vi:"Chụp ảnh", pt:"Tirar foto", it:"Scatta una foto" },
  "import.photoSub": { en:"Snap your sheet music", zh:"拍下你的乐谱", es:"Captura tu partitura", fr:"Photographie ta partition", de:"Noten abfotografieren", ja:"楽譜を撮影", ko:"악보를 찍어요", vi:"Chụp bản nhạc của bạn", pt:"Fotografe sua partitura", it:"Fotografa il tuo spartito" },
  "import.upload": { en:"Upload PDF / image", zh:"上传 PDF / 图片", es:"Subir PDF / imagen", fr:"Importer PDF / image", de:"PDF / Bild hochladen", ja:"PDF・画像をアップ", ko:"PDF / 이미지 업로드", vi:"Tải lên PDF / ảnh", pt:"Enviar PDF / imagem", it:"Carica PDF / immagine" },
  "import.uploadSub": { en:"From your device", zh:"从你的设备", es:"Desde tu dispositivo", fr:"Depuis ton appareil", de:"Von deinem Gerät", ja:"端末から", ko:"기기에서", vi:"Từ thiết bị của bạn", pt:"Do seu dispositivo", it:"Dal tuo dispositivo" },
  "import.reading": { en:"Reading your music…", zh:"正在识别乐谱…", es:"Leyendo tu música…", fr:"Lecture de ta partition…", de:"Noten werden gelesen…", ja:"楽譜を読み取り中…", ko:"악보를 읽는 중…", vi:"Đang đọc bản nhạc…", pt:"Lendo sua música…", it:"Sto leggendo lo spartito…" },
  "import.detecting": { en:"Detecting chords and melody.", zh:"正在检测和弦与旋律。", es:"Detectando acordes y melodía.", fr:"Détection des accords et de la mélodie.", de:"Akkorde und Melodie werden erkannt.", ja:"コードとメロディを検出中。", ko:"코드와 멜로디를 감지해요.", vi:"Đang nhận diện hợp âm và giai điệu.", pt:"Detectando acordes e melodia.", it:"Rilevo accordi e melodia." },
  "import.detected": { en:"Detected 8 chords · Key of G", zh:"识别到 8 个和弦 · G 调", es:"8 acordes detectados · Tono de Sol", fr:"8 accords détectés · Tonalité de Sol", de:"8 Akkorde erkannt · Tonart G", ja:"8 コード検出 · ト長調", ko:"코드 8개 감지 · G 조", vi:"Phát hiện 8 hợp âm · Giọng Sol", pt:"8 acordes detectados · Tom de Sol", it:"8 accordi rilevati · Tonalità di Sol" },
  "import.playLights": { en:"Play with lights", zh:"跟灯演奏", es:"Tocar con luces", fr:"Jouer avec les lumières", de:"Mit Lichtern spielen", ja:"ライトで弾く", ko:"불빛과 함께 연주", vi:"Chơi cùng đèn", pt:"Tocar com as luzes", it:"Suona con le luci" },
  "import.another": { en:"Import another", zh:"再导入一首", es:"Importar otra", fr:"Importer une autre", de:"Weitere importieren", ja:"別の楽譜を取込", ko:"다른 악보 가져오기", vi:"Nhập bản khác", pt:"Importar outra", it:"Importa un altro" },
};
Object.assign(PP_I18N, PP_I18N_2);

/* Lesson-type shelf content (titles + descriptive subs). Songs keep titles. */
const PP_ITEM_I18N = {
  e1: { title:{en:"Pop Chords I",zh:"流行和弦 I",es:"Acordes pop I",fr:"Accords pop I",de:"Pop-Akkorde I",ja:"ポップ和音 I",ko:"팝 코드 I",vi:"Hợp âm Pop I",pt:"Acordes pop I",it:"Accordi pop I"} },
  e2: { title:{en:"Both Hands",zh:"双手齐弹",es:"Ambas manos",fr:"Deux mains",de:"Beide Hände",ja:"両手で",ko:"양손으로",vi:"Cả hai tay",pt:"As duas mãos",it:"Entrambe le mani"},
        sub:{en:"Left + right together",zh:"左右手一起弹",es:"Izquierda + derecha juntas",fr:"Gauche + droite ensemble",de:"Links + rechts zusammen",ja:"左右いっしょに",ko:"왼손+오른손 함께",vi:"Tay trái + phải cùng lúc",pt:"Esquerda + direita juntas",it:"Sinistra + destra insieme"} },
  e4: { title:{en:"Reading Rhythm",zh:"读节奏",es:"Leer el ritmo",fr:"Lire le rythme",de:"Rhythmus lesen",ja:"リズムを読む",ko:"리듬 읽기",vi:"Đọc nhịp",pt:"Ler o ritmo",it:"Leggere il ritmo"},
        sub:{en:"Quarter & half notes",zh:"四分与二分音符",es:"Negras y blancas",fr:"Noires et blanches",de:"Viertel & halbe Noten",ja:"4分・2分音符",ko:"4분·2분음표",vi:"Nốt đen & trắng",pt:"Semínimas e mínimas",it:"Semiminime e minime"} },
  e5: { title:{en:"Chord Sprint",zh:"和弦冲刺",es:"Sprint de acordes",fr:"Sprint d'accords",de:"Akkord-Sprint",ja:"コードスプリント",ko:"코드 스프린트",vi:"Chạy hợp âm",pt:"Sprint de acordes",it:"Sprint di accordi"},
        sub:{en:"Speed drill",zh:"速度训练",es:"Práctica de velocidad",fr:"Exercice de vitesse",de:"Tempo-Übung",ja:"スピード練習",ko:"속도 훈련",vi:"Luyện tốc độ",pt:"Treino de velocidade",it:"Allenamento di velocità"} },
  m1: { title:{en:"Chord Changes",zh:"和弦转换",es:"Cambios de acordes",fr:"Changements d'accords",de:"Akkordwechsel",ja:"コードチェンジ",ko:"코드 전환",vi:"Chuyển hợp âm",pt:"Mudanças de acordes",it:"Cambi di accordo"},
        sub:{en:"Smooth transitions",zh:"流畅过渡",es:"Transiciones suaves",fr:"Transitions fluides",de:"Sanfte Übergänge",ja:"なめらかな移行",ko:"부드러운 전환",vi:"Chuyển mượt mà",pt:"Transições suaves",it:"Transizioni fluide"} },
  m3: { title:{en:"The Circle of 5ths",zh:"五度圈",es:"El círculo de quintas",fr:"Le cycle des quintes",de:"Der Quintenzirkel",ja:"五度圏",ko:"5도권",vi:"Vòng quãng năm",pt:"O ciclo das quintas",it:"Il circolo delle quinte"},
        sub:{en:"Why keys work",zh:"调性的奥秘",es:"Cómo funcionan las tonalidades",fr:"Comment marchent les tonalités",de:"Wie Tonarten funktionieren",ja:"調の仕組み",ko:"조성의 원리",vi:"Vì sao các giọng hoạt động",pt:"Como as tonalidades funcionam",it:"Come funzionano le tonalità"} },
  m4: { title:{en:"Inversion Gym",zh:"转位训练",es:"Gimnasio de inversiones",fr:"Gym des renversements",de:"Umkehrungs-Gym",ja:"転回形ジム",ko:"자리바꿈 훈련",vi:"Luyện thể đảo",pt:"Ginásio de inversões",it:"Palestra dei rivolti"},
        sub:{en:"Move between shapes",zh:"在指型间移动",es:"Cambia entre formas",fr:"Passe d'une forme à l'autre",de:"Zwischen Formen wechseln",ja:"フォーム間を移動",ko:"모양 사이 이동",vi:"Di chuyển giữa các thế tay",pt:"Mude entre as formas",it:"Passa tra le forme"} },
  h1: { title:{en:"Syncopation",zh:"切分音",es:"Síncopa",fr:"Syncope",de:"Synkope",ja:"シンコペーション",ko:"싱코페이션",vi:"Đảo phách",pt:"Síncope",it:"Sincope"},
        sub:{en:"Play off the beat",zh:"在弱拍上演奏",es:"Toca a contratiempo",fr:"Joue à contretemps",de:"Spiel gegen den Beat",ja:"裏拍で弾く",ko:"엇박으로 연주",vi:"Chơi lệch phách",pt:"Toque fora do tempo",it:"Suona in levare"} },
};
/* localize a shelf item; songs keep original title/sub */
function tItem(item, lang) {
  const m = PP_ITEM_I18N[item.id];
  const title = (m && m.title && (m.title[lang] || m.title.en)) || item.title;
  const sub = (m && m.sub && (m.sub[lang] || m.sub.en)) || item.sub;
  return { title, sub };
}
function tLevel(levelId, lang) { return t("level." + levelId, lang); }
/* localize a stored unit string (e.g. profile.lastUnit) by matching its English title */
function tUnit(unitStr, lang) {
  if (!unitStr) return unitStr;
  for (const id in PP_ITEM_I18N) {
    const m = PP_ITEM_I18N[id];
    if (m.title && m.title.en === unitStr) return m.title[lang] || m.title.en;
  }
  return unitStr;
}

Object.assign(window, { PP_I18N_2, PP_ITEM_I18N, tItem, tLevel, tUnit });

/* Localized titles for the new Kindergarten / University / Master shelf items (songs keep their titles). */
Object.assign(PP_ITEM_I18N, {
  k1: { title:{en:"First 3 Notes",zh:"最初三个音",es:"Las 3 primeras notas",fr:"Les 3 premières notes",de:"Die ersten 3 Töne",ja:"最初の3つの音",ko:"첫 세 음",vi:"3 nốt đầu tiên",pt:"As 3 primeiras notas",it:"Le prime 3 note"} },
  k2: { title:{en:"Find Middle C",zh:"找到中央 C",es:"Encuentra el Do central",fr:"Trouve le Do central",de:"Finde das mittlere C",ja:"真ん中のドを探す",ko:"가온 도 찾기",vi:"Tìm nốt Đô giữa",pt:"Ache o Dó central",it:"Trova il Do centrale"},
        sub:{en:"Your home base",zh:"你的大本营",es:"Tu base",fr:"Ton point d'ancrage",de:"Dein Heimatton",ja:"きみの基地",ko:"너의 홈 베이스",vi:"Vị trí gốc của bạn",pt:"Sua base",it:"La tua base"} },
  k4: { title:{en:"Loud & Soft",zh:"强与弱",es:"Fuerte y suave",fr:"Fort et doux",de:"Laut & Leise",ja:"強弱",ko:"셈과 여림",vi:"To & nhỏ",pt:"Forte e suave",it:"Forte e piano"},
        sub:{en:"Dynamics for tiny hands",zh:"小手也能玩的力度",es:"Dinámica para manos pequeñas",fr:"Les nuances pour petites mains",de:"Dynamik für kleine Hände",ja:"小さな手のための強弱",ko:"작은 손을 위한 셈여림",vi:"Sắc thái cho bàn tay nhỏ",pt:"Dinâmica para mãos pequenas",it:"Dinamica per manine"} },
  u1: { title:{en:"Jazz Voicings",zh:"爵士和声配置",es:"Voicings de jazz",fr:"Voicings jazz",de:"Jazz-Voicings",ja:"ジャズ・ボイシング",ko:"재즈 보이싱",vi:"Hợp âm jazz",pt:"Voicings de jazz",it:"Voicing jazz"},
        sub:{en:"Rootless & rich",zh:"无根音，更丰富",es:"Sin fundamental, con color",fr:"Sans fondamentale, riches",de:"Ohne Grundton, voll",ja:"ルートレスで豊か",ko:"루트리스, 풍부하게",vi:"Không nốt gốc, đầy màu",pt:"Sem fundamental, encorpado",it:"Senza fondamentale, ricchi"} },
  u2: { title:{en:"Improv Basics",zh:"即兴入门",es:"Improvisación básica",fr:"Bases de l'impro",de:"Improvisation: Basics",ja:"即興の基礎",ko:"즉흥 연주 기초",vi:"Ứng tấu cơ bản",pt:"Improviso básico",it:"Basi di improvvisazione"},
        sub:{en:"Make it up, on key",zh:"即兴又不跑调",es:"Inventa, sin desafinar",fr:"Invente, juste",de:"Erfinde, im Ton",ja:"その場で、外さず",ko:"음 맞게 즉흥으로",vi:"Tự chế, đúng tông",pt:"Invente, no tom",it:"Inventa, in tono"} },
  a1: { title:{en:"Concert Études",zh:"音乐会练习曲",es:"Estudios de concierto",fr:"Études de concert",de:"Konzertetüden",ja:"コンサート練習曲",ko:"콘서트 연습곡",vi:"Khúc luyện hòa nhạc",pt:"Estudos de concerto",it:"Studi da concerto"},
        sub:{en:"Recital-ready",zh:"登台无忧",es:"Listo para el recital",fr:"Prêt pour le récital",de:"Bereit fürs Konzert",ja:"本番仕様",ko:"무대 준비 완료",vi:"Sẵn sàng biểu diễn",pt:"Pronto para o recital",it:"Pronto per il recital"} },
  a2: { title:{en:"Your Signature Style",zh:"你的标志风格",es:"Tu estilo propio",fr:"Ton style signature",de:"Dein eigener Stil",ja:"きみだけのスタイル",ko:"너만의 시그니처",vi:"Phong cách riêng của bạn",pt:"Seu estilo próprio",it:"Il tuo stile unico"},
        sub:{en:"Sound like you",zh:"弹出你自己",es:"Suena como tú",fr:"Sonne comme toi",de:"Klinge nach dir",ja:"きみらしい音",ko:"너답게 들리게",vi:"Nghe ra chất bạn",pt:"Soe como você",it:"Suona come te"} },
});

/* ============ Practice + Profile strings ============ */
const PP_I18N_3 = {
  "pr.chords": { en:"Chord library", zh:"和弦库", es:"Acordes", fr:"Accords", de:"Akkorde", ja:"コード一覧", ko:"코드 모음", vi:"Thư viện hợp âm", pt:"Acordes", it:"Accordi" },
  "pr.free": { en:"Free play", zh:"自由弹奏", es:"Libre", fr:"Libre", de:"Frei spielen", ja:"自由演奏", ko:"자유 연주", vi:"Chơi tự do", pt:"Livre", it:"Libero" },
  "pr.hint": { en:"Pick a family → tap a chord to hear & see it", zh:"选择一个家族 → 点击和弦试听并查看", es:"Elige una familia → toca un acorde para oírlo y verlo", fr:"Choisis une famille → touche un accord pour l'entendre et le voir", de:"Wähle eine Familie → tippe einen Akkord zum Hören & Sehen", ja:"ファミリーを選び → コードをタップして聴いて見る", ko:"패밀리 선택 → 코드를 탭해 듣고 보기", vi:"Chọn một nhóm → chạm hợp âm để nghe & xem", pt:"Escolha uma família → toque um acorde para ouvir e ver", it:"Scegli una famiglia → tocca un accordo per sentirlo e vederlo" },
  "pr.root": { en:"Root", zh:"根音", es:"Raíz", fr:"Fondamentale", de:"Grundton", ja:"ルート", ko:"근음", vi:"Nốt gốc", pt:"Fundamental", it:"Fondamentale" },
  "pr.recipe": { en:"The recipe", zh:"构成", es:"La fórmula", fr:"La recette", de:"Das Rezept", ja:"レシピ", ko:"구성", vi:"Công thức", pt:"A fórmula", it:"La ricetta" },
  "pr.notes": { en:"The notes", zh:"音符", es:"Las notas", fr:"Les notes", de:"Die Noten", ja:"音", ko:"음", vi:"Các nốt", pt:"As notas", it:"Le note" },
  "pr.staff": { en:"On the staff", zh:"五线谱", es:"En el pentagrama", fr:"Sur la portée", de:"Im Notensystem", ja:"楽譜では", ko:"악보에서", vi:"Trên khuông nhạc", pt:"Na pauta", it:"Sul pentagramma" },
  "pr.hearIt": { en:"Hear it", zh:"试听", es:"Escuchar", fr:"Écouter", de:"Anhören", ja:"聴く", ko:"들어보기", vi:"Nghe thử", pt:"Ouvir", it:"Ascolta" },
  "pr.stacking": { en:"Stacking", zh:"叠置", es:"Estructura", fr:"Empilement", de:"Aufbau", ja:"積み方", ko:"쌓는 법", vi:"Cách xếp", pt:"Empilhamento", it:"Sovrapposizione" },

  "pf.dayStreak": { en:"Day streak", zh:"连续天数", es:"Días seguidos", fr:"Jours d'affilée", de:"Tage in Folge", ja:"連続日数", ko:"연속 일수", vi:"Chuỗi ngày", pt:"Dias seguidos", it:"Giorni di fila" },
  "pf.totalXp": { en:"Total XP", zh:"总经验", es:"XP total", fr:"XP total", de:"Gesamt-XP", ja:"合計XP", ko:"총 XP", vi:"Tổng XP", pt:"XP total", it:"XP totali" },
  "pf.gems": { en:"Gems", zh:"宝石", es:"Gemas", fr:"Gemmes", de:"Edelsteine", ja:"ジェム", ko:"보석", vi:"Đá quý", pt:"Gemas", it:"Gemme" },
  "pf.songsLearned": { en:"Songs learned", zh:"已学歌曲", es:"Canciones", fr:"Chansons", de:"Lieder gelernt", ja:"習得曲", ko:"배운 곡", vi:"Bài đã học", pt:"Músicas", it:"Brani imparati" },
  "pf.weekXp": { en:"385 XP · goal hit 5 of 7 days", zh:"385 XP · 7 天达标 5 天", es:"385 XP · meta en 5 de 7 días", fr:"385 XP · objectif atteint 5 j/7", de:"385 XP · Ziel an 5 von 7 Tagen", ja:"385 XP · 7日中5日達成", ko:"385 XP · 7일 중 5일 목표 달성", vi:"385 XP · đạt mục tiêu 5/7 ngày", pt:"385 XP · meta em 5 de 7 dias", it:"385 XP · obiettivo 5 giorni su 7" },
  "pf.weekXpShort": { en:"385 XP · 5/7 days", zh:"385 XP · 5/7 天", es:"385 XP · 5/7 días", fr:"385 XP · 5/7 j", de:"385 XP · 5/7 Tage", ja:"385 XP · 5/7日", ko:"385 XP · 5/7일", vi:"385 XP · 5/7 ngày", pt:"385 XP · 5/7 dias", it:"385 XP · 5/7 giorni" },
  "pf.path.chords": { en:"Chords path", zh:"和弦路线", es:"Ruta de acordes", fr:"Parcours Accords", de:"Akkord-Pfad", ja:"コース: 和音", ko:"코드 코스", vi:"Lộ trình Hợp âm", pt:"Trilha de acordes", it:"Percorso Accordi" },
  "pf.path.soloist": { en:"Soloist path", zh:"独奏路线", es:"Ruta de solista", fr:"Parcours Soliste", de:"Solist-Pfad", ja:"コース: ソロ", ko:"솔로 코스", vi:"Lộ trình Độc tấu", pt:"Trilha de solista", it:"Percorso Solista" },
  "ach.streak7": { en:"7-Day Streak", zh:"连续 7 天", es:"Racha 7 días", fr:"Série 7 jours", de:"7-Tage-Serie", ja:"7日連続", ko:"7일 연속", vi:"Chuỗi 7 ngày", pt:"7 dias seguidos", it:"Serie 7 giorni" },
  "ach.firstSong": { en:"First Song", zh:"第一首歌", es:"Primera canción", fr:"1re chanson", de:"Erstes Lied", ja:"初めての曲", ko:"첫 곡", vi:"Bài đầu tiên", pt:"1ª música", it:"Primo brano" },
  "ach.perfect": { en:"Perfect Lesson", zh:"完美课程", es:"Lección perfecta", fr:"Leçon parfaite", de:"Perfekte Lektion", ja:"完璧レッスン", ko:"완벽한 레슨", vi:"Bài hoàn hảo", pt:"Lição perfeita", it:"Lezione perfetta" },
  "ach.xp1000": { en:"1000 XP", zh:"1000 经验", es:"1000 XP", fr:"1000 XP", de:"1000 XP", ja:"1000 XP", ko:"1000 XP", vi:"1000 XP", pt:"1000 XP", it:"1000 XP" },
  "ach.chordMaster": { en:"Chord Master", zh:"和弦大师", es:"Maestro de acordes", fr:"Maître des accords", de:"Akkord-Meister", ja:"コードマスター", ko:"코드 마스터", vi:"Bậc thầy hợp âm", pt:"Mestre dos acordes", it:"Maestro degli accordi" },
  "ach.graduate": { en:"Grade Graduate", zh:"升级达人", es:"Graduado", fr:"Diplômé", de:"Absolvent", ja:"グレード修了", ko:"등급 졸업", vi:"Tốt nghiệp cấp", pt:"Graduado", it:"Diplomato" },
};
Object.assign(PP_I18N, PP_I18N_3);

/* Chord families + types (label / punchline / line / hook) per language */
const PP_CHORD_I18N = {
  fam: {
    triads: { name:{en:"Triads",zh:"三和弦",es:"Tríadas",fr:"Triades",de:"Dreiklänge",ja:"三和音",ko:"3화음",vi:"Hợp âm ba",pt:"Tríades",it:"Triadi"}, hook:{en:"3 notes stacked. The 'middle' note decides the mood.",zh:"三个音叠在一起。中间那个音决定情绪。",es:"3 notas apiladas. La nota del medio decide el ánimo.",fr:"3 notes empilées. La note du milieu donne l'humeur.",de:"3 Töne gestapelt. Der mittlere Ton bestimmt die Stimmung.",ja:"3つの音を重ねる。真ん中の音が気分を決める。",ko:"3개의 음을 쌓아요. 가운데 음이 분위기를 정해요.",vi:"3 nốt chồng lên. Nốt giữa quyết định cảm xúc.",pt:"3 notas empilhadas. A nota do meio define o clima.",it:"3 note impilate. La nota di mezzo decide l'umore."} },
    sevenths: { name:{en:"Sevenths",zh:"七和弦",es:"Séptimas",fr:"Septièmes",de:"Septakkorde",ja:"7thコード",ko:"7화음",vi:"Hợp âm bảy",pt:"Sétimas",it:"Settime"}, hook:{en:"Triad + one extra note on top. Richer, jazzier.",zh:"三和弦再加一个音。更丰富、更爵士。",es:"Tríada + una nota más arriba. Más rica y jazz.",fr:"Triade + une note en plus. Plus riche, plus jazz.",de:"Dreiklang + ein Ton oben drauf. Voller, jazziger.",ja:"三和音＋もう1音。豊かでジャジー。",ko:"3화음 + 위에 한 음 더. 더 풍부하고 재지해요.",vi:"Hợp âm ba + một nốt nữa. Đầy đặn, jazz hơn.",pt:"Tríade + uma nota a mais. Mais rica e jazz.",it:"Triade + una nota in più. Più ricca e jazz."} },
    suspended: { name:{en:"Suspended",zh:"挂留和弦",es:"Suspendidos",fr:"Suspendus",de:"Vorhalte",ja:"サスペンド",ko:"서스펜드",vi:"Hợp âm treo",pt:"Suspensos",it:"Sospesi"}, hook:{en:"Swap the middle note — no major or minor, just tension.",zh:"换掉中间的音 — 没有大小调，只有张力。",es:"Cambia la nota del medio: ni mayor ni menor, solo tensión.",fr:"Change la note du milieu — ni majeur ni mineur, juste de la tension.",de:"Tausch den mittleren Ton — kein Dur, kein Moll, nur Spannung.",ja:"真ん中の音を入れ替え — 長短ではなく緊張感。",ko:"가운데 음을 바꿔요 — 장·단조 없이 긴장감만.",vi:"Đổi nốt giữa — không trưởng/thứ, chỉ có độ căng.",pt:"Troque a nota do meio — nem maior nem menor, só tensão.",it:"Cambia la nota di mezzo — né maggiore né minore, solo tensione."} },
  },
  type: {
    major: { label:{en:"Major",zh:"大三和弦",es:"Mayor",fr:"Majeur",de:"Dur",ja:"メジャー",ko:"장조",vi:"Trưởng",pt:"Maior",it:"Maggiore"}, punch:{en:"Happy ☀️",zh:"明亮 ☀️",es:"Alegre ☀️",fr:"Joyeux ☀️",de:"Fröhlich ☀️",ja:"明るい ☀️",ko:"밝음 ☀️",vi:"Vui ☀️",pt:"Alegre ☀️",it:"Felice ☀️"}, line:{en:"Bright like a sunny birthday.",zh:"像阳光灿烂的生日一样明亮。",es:"Brillante como un cumpleaños soleado.",fr:"Lumineux comme un anniversaire ensoleillé.",de:"Strahlend wie ein sonniger Geburtstag.",ja:"晴れた誕生日みたいに明るい。",ko:"화창한 생일처럼 밝아요.",vi:"Tươi sáng như sinh nhật nắng đẹp.",pt:"Brilhante como um aniversário ensolarado.",it:"Luminoso come un compleanno di sole."} },
    minor: { label:{en:"Minor",zh:"小三和弦",es:"Menor",fr:"Mineur",de:"Moll",ja:"マイナー",ko:"단조",vi:"Thứ",pt:"Menor",it:"Minore"}, punch:{en:"Sad 🌧️",zh:"忧伤 🌧️",es:"Triste 🌧️",fr:"Triste 🌧️",de:"Traurig 🌧️",ja:"切ない 🌧️",ko:"슬픔 🌧️",vi:"Buồn 🌧️",pt:"Triste 🌧️",it:"Triste 🌧️"}, line:{en:"Slide the middle note DOWN a half-step.",zh:"把中间的音降低半音。",es:"Baja la nota del medio medio tono.",fr:"Descends la note du milieu d'un demi-ton.",de:"Schieb den mittleren Ton einen Halbton runter.",ja:"真ん中の音を半音下げる。",ko:"가운데 음을 반음 내려요.",vi:"Hạ nốt giữa xuống nửa cung.",pt:"Desça a nota do meio meio tom.",it:"Abbassa la nota di mezzo di un semitono."} },
    dim: { label:{en:"Diminished",zh:"减三和弦",es:"Disminuido",fr:"Diminué",de:"Vermindert",ja:"ディミニッシュ",ko:"감화음",vi:"Giảm",pt:"Diminuto",it:"Diminuito"}, punch:{en:"Spooky 👻",zh:"诡异 👻",es:"Tenebroso 👻",fr:"Inquiétant 👻",de:"Gruselig 👻",ja:"不気味 👻",ko:"으스스 👻",vi:"Rùng rợn 👻",pt:"Assustador 👻",it:"Spettrale 👻"}, line:{en:"Both top notes squished down — scary movie!",zh:"上面两个音都压低 — 恐怖片！",es:"Las dos notas de arriba bajan: ¡peli de miedo!",fr:"Les deux notes du haut descendent — film d'horreur !",de:"Beide oberen Töne runter — Gruselfilm!",ja:"上の2音を下げる — ホラー映画！",ko:"위 두 음을 눌러 내려요 — 공포 영화!",vi:"Hai nốt trên ép xuống — phim kinh dị!",pt:"As duas notas de cima descem — filme de terror!",it:"Le due note in alto giù — film horror!"} },
    aug: { label:{en:"Augmented",zh:"增三和弦",es:"Aumentado",fr:"Augmenté",de:"Übermäßig",ja:"オーグメント",ko:"증화음",vi:"Tăng",pt:"Aumentado",it:"Aumentato"}, punch:{en:"Dreamy ✨",zh:"梦幻 ✨",es:"Soñador ✨",fr:"Rêveur ✨",de:"Träumerisch ✨",ja:"幻想的 ✨",ko:"몽환적 ✨",vi:"Mơ màng ✨",pt:"Sonhador ✨",it:"Sognante ✨"}, line:{en:"Stretch the top note UP — floaty and mysterious.",zh:"把最高音升高 — 飘渺而神秘。",es:"Sube la nota de arriba: flotante y misterioso.",fr:"Monte la note du haut — flottant et mystérieux.",de:"Zieh den oberen Ton hoch — schwebend und geheimnisvoll.",ja:"一番上の音を上げる — 浮遊感と神秘。",ko:"맨 위 음을 올려요 — 떠다니듯 신비롭게.",vi:"Kéo nốt trên cùng lên — bồng bềnh, huyền bí.",pt:"Suba a nota de cima — flutuante e misteriosa.",it:"Alza la nota in cima — sospesa e misteriosa."} },
    maj7: { label:{en:"Major 7th",zh:"大七和弦",es:"Séptima mayor",fr:"Septième majeure",de:"Major 7",ja:"メジャー7th",ko:"메이저 7",vi:"Bảy trưởng",pt:"Sétima maior",it:"Settima maggiore"}, punch:{en:"Jazzy 😎",zh:"爵士 😎",es:"Jazz 😎",fr:"Jazzy 😎",de:"Jazzig 😎",ja:"ジャジー 😎",ko:"재지 😎",vi:"Jazz 😎",pt:"Jazz 😎",it:"Jazz 😎"}, line:{en:"Smooth, classy, coffee-shop vibes.",zh:"顺滑、优雅，咖啡馆氛围。",es:"Suave, elegante, ambiente de cafetería.",fr:"Doux, chic, ambiance café.",de:"Sanft, edel, Café-Atmosphäre.",ja:"なめらかで上品、カフェの雰囲気。",ko:"부드럽고 세련된 카페 감성.",vi:"Mượt, sang, không khí quán cà phê.",pt:"Suave, elegante, clima de cafeteria.",it:"Morbido, elegante, atmosfera da caffè."} },
    dom7: { label:{en:"Dominant 7th",zh:"属七和弦",es:"Séptima dominante",fr:"Septième de dominante",de:"Dominant 7",ja:"ドミナント7th",ko:"도미넌트 7",vi:"Bảy át",pt:"Sétima dominante",it:"Settima di dominante"}, punch:{en:"Bluesy 🎷",zh:"布鲁斯 🎷",es:"Blues 🎷",fr:"Blues 🎷",de:"Bluesig 🎷",ja:"ブルージー 🎷",ko:"블루지 🎷",vi:"Blues 🎷",pt:"Blues 🎷",it:"Blues 🎷"}, line:{en:"Itchy — it really wants to go home.",zh:"躁动 — 特别想回到主和弦。",es:"Inquieto: quiere volver a casa.",fr:"Impatient — il veut rentrer à la maison.",de:"Unruhig — will unbedingt nach Hause.",ja:"そわそわ — 主和音に帰りたがる。",ko:"근질근질 — 으뜸음으로 가고 싶어 해요.",vi:"Bồn chồn — rất muốn về chủ âm.",pt:"Inquieto — quer voltar pra casa.",it:"Irrequieto — vuole tornare a casa."} },
    min7: { label:{en:"Minor 7th",zh:"小七和弦",es:"Séptima menor",fr:"Septième mineure",de:"Moll 7",ja:"マイナー7th",ko:"마이너 7",vi:"Bảy thứ",pt:"Sétima menor",it:"Settima minore"}, punch:{en:"Chill 🛋️",zh:"慵懒 🛋️",es:"Relax 🛋️",fr:"Cool 🛋️",de:"Entspannt 🛋️",ja:"まったり 🛋️",ko:"느긋 🛋️",vi:"Thư thái 🛋️",pt:"Relax 🛋️",it:"Rilassato 🛋️"}, line:{en:"Mellow and cozy, like a lazy Sunday.",zh:"柔和惬意，像慵懒的周日。",es:"Suave y acogedor, como un domingo perezoso.",fr:"Doux et cosy, comme un dimanche paresseux.",de:"Weich und gemütlich, wie ein fauler Sonntag.",ja:"まろやかで心地よい、のんびり日曜。",ko:"부드럽고 아늑한, 나른한 일요일.",vi:"Êm và ấm, như Chủ nhật lười.",pt:"Suave e aconchegante, como domingo preguiçoso.",it:"Morbido e accogliente, come una domenica pigra."} },
    sus2: { label:{en:"Suspended 2",zh:"挂二和弦",es:"Suspendido 2",fr:"Suspendu 2",de:"Sus2",ja:"サス2",ko:"서스2",vi:"Treo 2",pt:"Suspenso 2",it:"Sospeso 2"}, punch:{en:"Open 🌅",zh:"开阔 🌅",es:"Abierto 🌅",fr:"Ouvert 🌅",de:"Offen 🌅",ja:"オープン 🌅",ko:"열린 🌅",vi:"Khoáng đạt 🌅",pt:"Aberto 🌅",it:"Aperto 🌅"}, line:{en:"No happy/sad — wide and waiting.",zh:"无悲喜 — 开阔而期待。",es:"Ni alegre ni triste: amplio y a la espera.",fr:"Ni gai ni triste — large et en attente.",de:"Weder fröhlich noch traurig — weit und wartend.",ja:"明るくも暗くもない — 広がりと期待。",ko:"밝지도 슬프지도 않은 — 넓고 기다리는.",vi:"Không vui/buồn — rộng mở và chờ đợi.",pt:"Nem alegre nem triste — amplo e à espera.",it:"Né felice né triste — ampio e in attesa."} },
    sus4: { label:{en:"Suspended 4",zh:"挂四和弦",es:"Suspendido 4",fr:"Suspendu 4",de:"Sus4",ja:"サス4",ko:"서스4",vi:"Treo 4",pt:"Suspenso 4",it:"Sospeso 4"}, punch:{en:"Suspense 🎬",zh:"悬念 🎬",es:"Suspense 🎬",fr:"Suspense 🎬",de:"Spannung 🎬",ja:"サスペンス 🎬",ko:"긴장감 🎬",vi:"Hồi hộp 🎬",pt:"Suspense 🎬",it:"Suspense 🎬"}, line:{en:"Hangs in the air — needs to resolve!",zh:"悬在空中 — 需要解决！",es:"Queda en el aire: ¡necesita resolver!",fr:"Reste en suspens — doit se résoudre !",de:"Hängt in der Luft — muss aufgelöst werden!",ja:"宙ぶらりん — 解決が必要！",ko:"공중에 떠 있어요 — 해결이 필요해요!",vi:"Lơ lửng — cần được giải quyết!",pt:"Fica no ar — precisa resolver!",it:"Resta sospeso — deve risolversi!"} },
  },
};
function tChordFam(id, field, lang) { const e = PP_CHORD_I18N.fam[id]; return e && e[field] ? (e[field][lang] || e[field].en) : ""; }

/* Natively-written chord descriptions (one per language — NOT translated from English). */
const PP_CHORD_LINE = {
  major: { en:"Big, sunny, can't-stop-smiling sound.", zh:"阳光满满，一听就想笑。", es:"Suena a sol y a sonrisas.", fr:"Lumineux, ça donne le sourire.", de:"Strahlt wie ein Sommertag.", ja:"ぱっと晴れた、にっこり笑顔の音。", ko:"햇살처럼 환하게 웃는 소리예요.", vi:"Nghe là thấy nắng và nụ cười.", pt:"Tem cara de sol e sorriso.", it:"Sa di sole e di sorrisi." },
  minor: { en:"A little blue — the rainy-day chord.", zh:"淡淡忧伤，像下雨天。", es:"Un poco melancólico, de día de lluvia.", fr:"Un brin mélancolique, comme la pluie.", de:"Etwas wehmütig, wie Regenwetter.", ja:"少し切ない、雨の日の音。", ko:"조금 우울한, 비 오는 날 소리.", vi:"Hơi buồn, như một ngày mưa.", pt:"Meio melancólico, de dia chuvoso.", it:"Un po' malinconico, da giorno di pioggia." },
  dim: { en:"Tiptoe-in-the-dark, goosebumps sound.", zh:"在黑暗里蹑手蹑脚，起鸡皮疙瘩。", es:"De puntillas en la oscuridad: pone los pelos de punta.", fr:"Sur la pointe des pieds dans le noir, ça donne des frissons.", de:"Auf Zehenspitzen im Dunkeln — Gänsehaut.", ja:"暗闇を忍び足、ぞわっとする音。", ko:"어둠 속 발끝으로, 소름 돋는 소리.", vi:"Rón rén trong bóng tối, nổi da gà.", pt:"Na ponta dos pés no escuro, dá arrepio.", it:"In punta di piedi al buio, fa venire i brividi." },
  aug: { en:"Floaty and magical, like a daydream.", zh:"飘飘忽忽，像在做白日梦。", es:"Flotante y mágico, como soñar despierto.", fr:"Flottant et magique, comme une rêverie.", de:"Schwebend und magisch, wie ein Tagtraum.", ja:"ふわっと魔法みたい、白昼夢の音。", ko:"둥실 마법 같은, 백일몽 소리.", vi:"Bồng bềnh kỳ ảo, như mơ giữa ban ngày.", pt:"Flutuante e mágico, como sonhar acordado.", it:"Sospeso e magico, come un sogno a occhi aperti." },
  maj7: { en:"Velvet-smooth, sunset-café cool.", zh:"丝绒般顺滑，黄昏咖啡馆的格调。", es:"Suave como terciopelo, café al atardecer.", fr:"Doux comme du velours, café au coucher du soleil.", de:"Samtweich, Café-bei-Sonnenuntergang-cool.", ja:"ベルベットみたいに滑らか、夕暮れカフェの粋。", ko:"벨벳처럼 부드러운, 노을 카페 감성.", vi:"Mượt như nhung, chất quán cà phê hoàng hôn.", pt:"Macio como veludo, café ao pôr do sol.", it:"Vellutato, da caffè al tramonto." },
  dom7: { en:"Restless — it's already leaning toward home.", zh:"有点坐不住，急着想回家。", es:"Inquieto: ya quiere volver a casa.", fr:"Impatient, il penche déjà vers la maison.", de:"Rastlos — es zieht schon nach Hause.", ja:"そわそわ、もう家に帰りたがってる。", ko:"안절부절, 벌써 집으로 기울어요.", vi:"Bồn chồn, đã muốn về nhà rồi.", pt:"Inquieto, já puxando pra casa.", it:"Irrequieto, tira già verso casa." },
  min7: { en:"Comfy socks and a lazy Sunday.", zh:"像穿着软袜子的慵懒周日。", es:"Calcetines cómodos y domingo perezoso.", fr:"Chaussettes douillettes, dimanche tranquille.", de:"Kuschelsocken und fauler Sonntag.", ja:"ふわふわ靴下、のんびり日曜。", ko:"포근한 양말, 나른한 일요일.", vi:"Tất ấm và một Chủ nhật lười.", pt:"Meias confortáveis e domingo preguiçoso.", it:"Calzini comodi e domenica pigra." },
  sus2: { en:"Wide-open sky, holding its breath.", zh:"天空开阔，屏住呼吸。", es:"Cielo abierto, conteniendo el aliento.", fr:"Ciel grand ouvert, qui retient son souffle.", de:"Weiter Himmel, hält den Atem an.", ja:"広い空、息をのむ感じ。", ko:"탁 트인 하늘, 숨을 참는 느낌.", vi:"Bầu trời rộng mở, nín thở chờ.", pt:"Céu aberto, prendendo a respiração.", it:"Cielo aperto, col fiato sospeso." },
  sus4: { en:"On its tiptoes, waiting to land.", zh:"踮着脚尖，等着落地。", es:"De puntillas, esperando aterrizar.", fr:"Sur la pointe des pieds, attend de se poser.", de:"Auf Zehenspitzen, wartet auf die Auflösung.", ja:"つま先立ちで、着地を待ってる。", ko:"발끝으로 서서, 내려앉길 기다려요.", vi:"Nhón chân, chờ được hạ xuống.", pt:"Na ponta dos pés, esperando pousar.", it:"In punta di piedi, aspetta di posarsi." },
};
function tChordType(id, field, lang) {
  if (field === "line" && PP_CHORD_LINE[id]) return PP_CHORD_LINE[id][lang] || PP_CHORD_LINE[id].en;
  const e = PP_CHORD_I18N.type[id]; return e && e[field] ? (e[field][lang] || e[field].en) : "";
}

Object.assign(window, { PP_I18N_3, PP_CHORD_I18N, tChordFam, tChordType });

Object.assign(window, { PP_LANGS, PP_I18N, PP_CHARTS, PP_LESSON_I18N, t, tLesson, langTTS });

/* ===== Appearance / Privacy / Microphone / Diploma (10 languages) ===== */
Object.assign(PP_I18N, {
  "settings.appearance": { en:"Appearance", zh:"外观", es:"Apariencia", fr:"Apparence", de:"Darstellung", ja:"外観", ko:"화면", vi:"Giao diện", pt:"Aparência", it:"Aspetto" },
  "settings.darkMode": { en:"Dark mode", zh:"深色模式", es:"Modo oscuro", fr:"Mode sombre", de:"Dunkelmodus", ja:"ダークモード", ko:"다크 모드", vi:"Chế độ tối", pt:"Modo escuro", it:"Modo scuro" },
  "settings.darkModeSub": { en:"Switch the app to a darker theme", zh:"切换到深色主题", es:"Cambia la app a un tema oscuro", fr:"Passe l'app en thème sombre", de:"Wechselt zu einem dunklen Design", ja:"アプリを暗いテーマに切り替え", ko:"앱을 어두운 테마로 전환", vi:"Chuyển ứng dụng sang nền tối", pt:"Muda o app para um tema escuro", it:"Passa a un tema scuro" },
  "settings.privacy": { en:"Privacy & permissions", zh:"隐私与权限", es:"Privacidad y permisos", fr:"Confidentialité et autorisations", de:"Datenschutz & Berechtigungen", ja:"プライバシーと権限", ko:"개인정보 및 권한", vi:"Quyền riêng tư & cấp phép", pt:"Privacidade e permissões", it:"Privacy e autorizzazioni" },
  "settings.microphone": { en:"Microphone", zh:"麦克风", es:"Micrófono", fr:"Micro", de:"Mikrofon", ja:"マイク", ko:"마이크", vi:"Micrô", pt:"Microfone", it:"Microfono" },
  "settings.micAllowed": { en:"Allowed · hears the notes you play", zh:"已允许 · 聆听你弹的音", es:"Permitido · escucha las notas que tocas", fr:"Autorisé · écoute les notes jouées", de:"Erlaubt · hört deine Töne", ja:"許可済み · 弾いた音を聞きます", ko:"허용됨 · 연주하는 음을 들어요", vi:"Đã cho phép · nghe nốt bạn chơi", pt:"Permitido · ouve as notas que você toca", it:"Consentito · ascolta le note che suoni" },
  "settings.micOff": { en:"Off · feedback paused", zh:"已关闭 · 反馈已暂停", es:"Apagado · sin feedback", fr:"Désactivé · retour en pause", de:"Aus · Feedback pausiert", ja:"オフ · フィードバック停止中", ko:"꺼짐 · 피드백 일시정지", vi:"Tắt · tạm dừng phản hồi", pt:"Desligado · feedback pausado", it:"Spento · feedback in pausa" },

  "mic.title": { en:"Microphone access", zh:"麦克风权限", es:"Acceso al micrófono", fr:"Accès au micro", de:"Mikrofonzugriff", ja:"マイクへのアクセス", ko:"마이크 접근", vi:"Quyền micrô", pt:"Acesso ao microfone", it:"Accesso al microfono" },
  "mic.reason": { en:"Piano Professor listens through your microphone to hear the notes you play and give instant feedback. Audio stays on your device — it's never recorded or shared.", zh:"Piano Professor 通过麦克风聆听你弹奏的音符，并即时给出反馈。声音只在你的设备上处理 —— 绝不录制或分享。", es:"Piano Professor usa el micrófono para oír las notas que tocas y darte feedback al instante. El audio se queda en tu dispositivo: nunca se graba ni se comparte.", fr:"Piano Professor écoute via le micro les notes que tu joues pour te donner un retour instantané. L'audio reste sur ton appareil — jamais enregistré ni partagé.", de:"Piano Professor hört über das Mikrofon deine gespielten Töne und gibt sofort Feedback. Der Ton bleibt auf deinem Gerät — er wird nie aufgenommen oder geteilt.", ja:"Piano Professor はマイクであなたの弾いた音を聞き、すぐにフィードバックします。音声は端末内だけで処理され、録音も共有もされません。", ko:"Piano Professor는 마이크로 연주하는 음을 듣고 즉시 피드백을 줘요. 소리는 기기 안에서만 처리되며 절대 녹음하거나 공유하지 않아요.", vi:"Piano Professor dùng micrô để nghe các nốt bạn chơi và phản hồi tức thì. Âm thanh chỉ xử lý trên thiết bị — không bao giờ ghi âm hay chia sẻ.", pt:"O Piano Professor usa o microfone para ouvir as notas que você toca e dar feedback na hora. O áudio fica no seu aparelho — nunca é gravado nem compartilhado.", it:"Piano Professor usa il microfono per sentire le note che suoni e darti un riscontro immediato. L'audio resta sul tuo dispositivo — non viene mai registrato né condiviso." },
  "mic.onDevice": { en:"Processed on-device · never shared", zh:"仅在设备上处理 · 绝不分享", es:"Procesado en el dispositivo · nunca se comparte", fr:"Traité sur l'appareil · jamais partagé", de:"Auf dem Gerät verarbeitet · nie geteilt", ja:"端末内で処理 · 共有なし", ko:"기기 내 처리 · 공유 안 함", vi:"Xử lý trên thiết bị · không chia sẻ", pt:"Processado no aparelho · nunca compartilhado", it:"Elaborato sul dispositivo · mai condiviso" },
  "mic.allow": { en:"Allow microphone", zh:"允许麦克风", es:"Permitir micrófono", fr:"Autoriser le micro", de:"Mikrofon erlauben", ja:"マイクを許可", ko:"마이크 허용", vi:"Cho phép micrô", pt:"Permitir microfone", it:"Consenti microfono" },
  "mic.keep": { en:"Keep allowed", zh:"保持允许", es:"Seguir permitido", fr:"Garder autorisé", de:"Erlaubt lassen", ja:"許可のまま", ko:"계속 허용", vi:"Giữ cho phép", pt:"Manter permitido", it:"Mantieni consentito" },
  "mic.turnOff": { en:"Turn off", zh:"关闭", es:"Desactivar", fr:"Désactiver", de:"Ausschalten", ja:"オフにする", ko:"끄기", vi:"Tắt", pt:"Desativar", it:"Disattiva" },
  "mic.notNow": { en:"Not now", zh:"暂不", es:"Ahora no", fr:"Plus tard", de:"Nicht jetzt", ja:"後で", ko:"나중에", vi:"Để sau", pt:"Agora não", it:"Non ora" },

  "dip.congrats": { en:"You graduated!", zh:"你毕业啦！", es:"¡Te graduaste!", fr:"Diplômé(e) !", de:"Abschluss geschafft!", ja:"卒業おめでとう！", ko:"졸업했어요!", vi:"Bạn đã tốt nghiệp!", pt:"Você se formou!", it:"Ti sei diplomato!" },
  "dip.cert": { en:"Certificate of Graduation", zh:"毕业证书", es:"Diploma de graduación", fr:"Diplôme de fin d'études", de:"Abschlusszeugnis", ja:"卒業証書", ko:"졸업장", vi:"Chứng nhận tốt nghiệp", pt:"Certificado de conclusão", it:"Diploma di completamento" },
  "dip.academy": { en:"Piano Professor Academy", zh:"Piano Professor 学院", es:"Academia Piano Professor", fr:"Académie Piano Professor", de:"Piano-Professor-Akademie", ja:"ピアノ・プロフェッサー学院", ko:"피아노 프로페서 아카데미", vi:"Học viện Piano Professor", pt:"Academia Piano Professor", it:"Accademia Piano Professor" },
  "dip.awardedTo": { en:"Proudly awarded to", zh:"谨此颁发给", es:"Otorgado con orgullo a", fr:"Décerné avec fierté à", de:"Stolz verliehen an", ja:"誇りをもって授与", ko:"자랑스럽게 수여함", vi:"Tự hào trao tặng cho", pt:"Concedido com orgulho a", it:"Conferito con orgoglio a" },
  "dip.graduateOf": { en:"Graduate of", zh:"毕业等级", es:"Egresado de", fr:"Diplômé(e) de", de:"Absolvent von", ja:"修了レベル", ko:"수료 과정", vi:"Tốt nghiệp", pt:"Formado em", it:"Diplomato in" },
  "dip.report": { en:"Student report", zh:"学员评语", es:"Informe del alumno", fr:"Bulletin de l'élève", de:"Schülerbericht", ja:"受講者レポート", ko:"학생 리포트", vi:"Nhận xét học viên", pt:"Boletim do aluno", it:"Pagella dello studente" },
  "dip.dean": { en:"Maestro · Dean of Lit Keys", zh:"Maestro · 亮键学院院长", es:"Maestro · Decano de las Teclas", fr:"Maestro · Doyen des Touches", de:"Maestro · Dekan der Tasten", ja:"マエストロ · 光る鍵盤学部長", ko:"마에스트로 · 빛나는 건반 학장", vi:"Maestro · Hiệu trưởng Phím Sáng", pt:"Maestro · Reitor das Teclas", it:"Maestro · Preside dei Tasti" },
  "dip.classOf": { en:"Class of", zh:"届", es:"Promoción", fr:"Promotion", de:"Jahrgang", ja:"卒業年度", ko:"졸업 기수", vi:"Khóa", pt:"Turma de", it:"Classe" },
  "dip.share": { en:"Share to story", zh:"分享到快拍", es:"Compartir en historia", fr:"Partager en story", de:"In Story teilen", ja:"ストーリーに共有", ko:"스토리에 공유", vi:"Chia sẻ lên story", pt:"Compartilhar no story", it:"Condividi nella storia" },
  "dip.save": { en:"Save image", zh:"保存图片", es:"Guardar imagen", fr:"Enregistrer l'image", de:"Bild speichern", ja:"画像を保存", ko:"이미지 저장", vi:"Lưu ảnh", pt:"Salvar imagem", it:"Salva immagine" },
  "dip.getDiploma": { en:"Get your diploma 🎓", zh:"领取毕业证书 🎓", es:"Recibe tu diploma 🎓", fr:"Reçois ton diplôme 🎓", de:"Hol dir dein Zeugnis 🎓", ja:"卒業証書を受け取る 🎓", ko:"졸업장 받기 🎓", vi:"Nhận chứng nhận 🎓", pt:"Pegar seu diploma 🎓", it:"Ritira il diploma 🎓" },
  "dip.shared": { en:"Saved! Ready to post to your story 🎉", zh:"已保存！可以发到快拍啦 🎉", es:"¡Guardado! Listo para tu historia 🎉", fr:"Enregistré ! Prêt pour ta story 🎉", de:"Gespeichert! Bereit für deine Story 🎉", ja:"保存しました！ストーリーに投稿できます 🎉", ko:"저장됐어요! 스토리에 올릴 준비 완료 🎉", vi:"Đã lưu! Sẵn sàng đăng story 🎉", pt:"Salvo! Pronto para o seu story 🎉", it:"Salvato! Pronto per la tua storia 🎉" },
});

/* ===== Monetization: Paywall · Upsell · Manage Sub (10 languages) =====
   Benefits + upsell carry personality; payment/processing/legal copy stays clear & trustworthy. */
Object.assign(PP_I18N, {
  "pw.headline": { en:"Go Premium,\nlevel up faster.", zh:"升级会员，\n开挂式进步。", es:"Hazte Premium,\nsube de nivel ya.", fr:"Passe Premium,\nprogresse à fond.", de:"Hol dir Premium,\nlevel schneller hoch.", ja:"プレミアムで\n一気にレベルアップ。", ko:"프리미엄으로\n초고속 레벨업.", vi:"Lên Premium,\nlên trình nhanh hơn.", pt:"Seja Premium,\nsuba de nível mais rápido.", it:"Passa a Premium,\nsali di livello più in fretta." },
  "pw.sub": { en:"Unlock the whole songbook and every level — for the whole crew.", zh:"解锁整本曲库和所有等级——全家一起爽。", es:"Desbloquea todo el cancionero y cada nivel, para toda la pandilla.", fr:"Débloque tout le répertoire et chaque niveau, pour toute la bande.", de:"Schalte das ganze Liederbuch und jedes Level frei — für die ganze Crew.", ja:"全曲＆全レベルを解放——家族みんなで。", ko:"전체 송북과 모든 레벨을 해제 — 온 가족이 다 같이.", vi:"Mở khoá cả kho nhạc và mọi cấp độ — cho cả nhà.", pt:"Libere o cancioneiro inteiro e todos os níveis — pra galera toda.", it:"Sblocca tutto il repertorio e ogni livello — per tutta la crew." },
  "pw.bSongs": { en:"Every song & lesson, unlocked", zh:"所有歌曲和课程，全解锁", es:"Cada canción y lección, desbloqueadas", fr:"Tous les morceaux et leçons, débloqués", de:"Jeder Song & jede Lektion, frei", ja:"全曲＆全レッスン解放", ko:"모든 곡과 레슨 해제", vi:"Mọi bài hát & bài học, mở hết", pt:"Toda música e lição, liberadas", it:"Ogni brano e lezione, sbloccati" },
  "pw.bHearts": { en:"Unlimited hearts — never sit out", zh:"无限爱心——再也不用等", es:"Vidas infinitas — sin esperas", fr:"Cœurs illimités — jamais sur le banc", de:"Unbegrenzte Herzen — nie pausieren", ja:"ハート無限——待ち時間ゼロ", ko:"하트 무제한 — 기다림 없이", vi:"Tim vô hạn — khỏi ngồi chờ", pt:"Vidas infinitas — sem esperar", it:"Cuori illimitati — mai in panchina" },
  "pw.bProfiles": { en:"Up to 5 profiles for the whole crew", zh:"最多 5 个用户，全家都能玩", es:"Hasta 5 perfiles para toda la pandilla", fr:"Jusqu'à 5 profils pour toute la bande", de:"Bis zu 5 Profile für die ganze Crew", ja:"最大5プロフィール、家族みんな", ko:"최대 5개 프로필, 온 가족", vi:"Tối đa 5 hồ sơ cho cả nhà", pt:"Até 5 perfis pra galera toda", it:"Fino a 5 profili per tutta la crew" },
  "pw.bLed": { en:"LED themes + rainbow mode", zh:"LED 主题 + 彩虹模式", es:"Temas LED + modo arcoíris", fr:"Thèmes LED + mode arc-en-ciel", de:"LED-Themen + Regenbogen-Modus", ja:"LEDテーマ + レインボー", ko:"LED 테마 + 무지개 모드", vi:"Chủ đề LED + chế độ cầu vồng", pt:"Temas LED + modo arco-íris", it:"Temi LED + modalità arcobaleno" },
  "pw.bPaths": { en:"Soloist + Chords course paths", zh:"独奏 + 和弦双修课程", es:"Rutas de Solista + Acordes", fr:"Parcours Soliste + Accords", de:"Solist- + Akkord-Lernpfade", ja:"ソロ＋コードの2コース", ko:"솔로 + 코드 코스 둘 다", vi:"Lộ trình Độc tấu + Hợp âm", pt:"Trilhas de Solista + Acordes", it:"Percorsi Solista + Accordi" },
  "pw.choose": { en:"Choose your plan", zh:"选择你的套餐", es:"Elige tu plan", fr:"Choisis ta formule", de:"Wähle deinen Plan", ja:"プランを選ぼう", ko:"플랜을 골라 봐", vi:"Chọn gói của bạn", pt:"Escolha seu plano", it:"Scegli il tuo piano" },
  "pw.annual": { en:"Annual · save 37%", zh:"年付 · 省 37%", es:"Anual · ahorra 37%", fr:"Annuel · -37%", de:"Jährlich · 37% sparen", ja:"年額 · 37%お得", ko:"연간 · 37% 할인", vi:"Năm · tiết kiệm 37%", pt:"Anual · economize 37%", it:"Annuale · -37%" },
  "pw.monthly": { en:"Monthly", zh:"月付", es:"Mensual", fr:"Mensuel", de:"Monatlich", ja:"月額", ko:"월간", vi:"Hàng tháng", pt:"Mensal", it:"Mensile" },
  "pw.trialNote": { en:"Every plan starts with a 7-day free trial. Cancel anytime.", zh:"每个套餐都含 7 天免费试用，随时可取消。", es:"Cada plan incluye 7 días de prueba gratis. Cancela cuando quieras.", fr:"Chaque formule démarre par 7 jours d'essai gratuit. Annule quand tu veux.", de:"Jeder Plan startet mit 7 Tagen gratis. Jederzeit kündbar.", ja:"どのプランも7日間無料。いつでも解約OK。", ko:"모든 플랜은 7일 무료 체험으로 시작해요. 언제든 해지 가능.", vi:"Mọi gói đều có 7 ngày dùng thử miễn phí. Huỷ lúc nào cũng được.", pt:"Todo plano começa com 7 dias grátis. Cancele quando quiser.", it:"Ogni piano parte con 7 giorni gratis. Disdici quando vuoi." },
  "pw.perMonth": { en:"per month", zh:"每月", es:"al mes", fr:"par mois", de:"pro Monat", ja:"月あたり", ko:"월", vi:"mỗi tháng", pt:"por mês", it:"al mese" },
  "pw.best": { en:"Best value", zh:"最划算", es:"Mejor precio", fr:"Top deal", de:"Bester Deal", ja:"いちばんお得", ko:"가성비 최고", vi:"Đáng nhất", pt:"Melhor custo", it:"Più conveniente" },
  "pw.billedYearly": { en:"billed yearly", zh:"按年计费", es:"facturado al año", fr:"facturé à l'année", de:"jährliche Abrechnung", ja:"年一括", ko:"연 단위 결제", vi:"tính theo năm", pt:"cobrado ao ano", it:"addebito annuale" },
  "pw.startTrial": { en:"Start 7-day free trial", zh:"开始 7 天免费试用", es:"Empezar prueba gratis de 7 días", fr:"Démarrer l'essai gratuit de 7 jours", de:"7 Tage gratis starten", ja:"7日間の無料体験を始める", ko:"7일 무료 체험 시작", vi:"Bắt đầu dùng thử 7 ngày", pt:"Começar teste grátis de 7 dias", it:"Inizia la prova gratis di 7 giorni" },
  "pw.thenPrice": { en:"Then {price}/mo · {plan}. Cancel anytime in Settings.", zh:"之后 {price}/月 · {plan}。可随时在设置中取消。", es:"Luego {price}/mes · {plan}. Cancela cuando quieras en Ajustes.", fr:"Puis {price}/mois · {plan}. Annule quand tu veux dans les Réglages.", de:"Danach {price}/Mon. · {plan}. Jederzeit in den Einstellungen kündbar.", ja:"その後 {price}/月 · {plan}。設定からいつでも解約可。", ko:"이후 {price}/월 · {plan}. 설정에서 언제든 해지.", vi:"Sau đó {price}/tháng · {plan}. Huỷ bất cứ lúc nào trong Cài đặt.", pt:"Depois {price}/mês · {plan}. Cancele quando quiser nos Ajustes.", it:"Poi {price}/mese · {plan}. Disdici quando vuoi nelle Impostazioni." },
  "pw.procTitle": { en:"Starting your free trial…", zh:"正在开启免费试用…", es:"Iniciando tu prueba gratis…", fr:"Démarrage de ton essai gratuit…", de:"Gratis-Test wird gestartet…", ja:"無料体験を開始しています…", ko:"무료 체험을 시작하는 중…", vi:"Đang bắt đầu dùng thử miễn phí…", pt:"Iniciando seu teste grátis…", it:"Avvio della prova gratuita…" },
  "pw.procSub": { en:"Securely confirming with the App Store.", zh:"正在通过 App Store 安全确认。", es:"Confirmando de forma segura con la App Store.", fr:"Confirmation sécurisée avec l'App Store.", de:"Sichere Bestätigung über den App Store.", ja:"App Store で安全に確認しています。", ko:"App Store에서 안전하게 확인 중이에요.", vi:"Đang xác nhận an toàn với App Store.", pt:"Confirmando com segurança na App Store.", it:"Conferma sicura con l'App Store." },
  "pw.errTitle": { en:"Payment didn't go through", zh:"支付未成功", es:"El pago no se completó", fr:"Le paiement n'a pas abouti", de:"Zahlung nicht erfolgreich", ja:"お支払いを完了できませんでした", ko:"결제가 완료되지 않았어요", vi:"Thanh toán chưa thành công", pt:"O pagamento não foi concluído", it:"Il pagamento non è andato a buon fine" },
  "pw.errSub": { en:"No charge was made. Check your payment method and try again — your free trial is still waiting.", zh:"未产生任何扣费。请检查支付方式后重试——你的免费试用仍在等你。", es:"No se hizo ningún cargo. Revisa tu método de pago e inténtalo de nuevo: tu prueba gratis sigue ahí.", fr:"Aucun débit n'a eu lieu. Vérifie ton moyen de paiement et réessaie — ton essai gratuit t'attend toujours.", de:"Es wurde nichts abgebucht. Prüf deine Zahlungsart und versuch es erneut — dein Gratis-Test wartet noch.", ja:"請求は発生していません。お支払い方法を確認して再試行してください——無料体験はまだ待っています。", ko:"청구된 금액은 없어요. 결제 수단을 확인하고 다시 시도해 주세요 — 무료 체험은 그대로 있어요.", vi:"Chưa có khoản phí nào. Kiểm tra phương thức thanh toán rồi thử lại — bản dùng thử vẫn đang chờ bạn.", pt:"Nenhuma cobrança foi feita. Verifique sua forma de pagamento e tente de novo — seu teste grátis continua aí.", it:"Nessun addebito effettuato. Controlla il metodo di pagamento e riprova — la tua prova gratuita ti aspetta ancora." },
  "pw.welcome": { en:"Welcome to Premium! 🎉 7-day free trial started.", zh:"欢迎加入会员！🎉 7 天免费试用已开始。", es:"¡Bienvenido a Premium! 🎉 Empezó tu prueba de 7 días.", fr:"Bienvenue en Premium ! 🎉 Essai de 7 jours lancé.", de:"Willkommen bei Premium! 🎉 7-Tage-Test gestartet.", ja:"プレミアムへようこそ！🎉 7日間の無料体験スタート。", ko:"프리미엄에 온 걸 환영해요! 🎉 7일 무료 체험 시작.", vi:"Chào mừng đến Premium! 🎉 Đã bắt đầu 7 ngày dùng thử.", pt:"Bem-vindo ao Premium! 🎉 Teste de 7 dias iniciado.", it:"Benvenuto in Premium! 🎉 Prova di 7 giorni avviata." },

  "plan.individual": { en:"Individual", zh:"Individual", es:"Individual", fr:"Individual", de:"Individual", ja:"Individual", ko:"Individual", vi:"Individual", pt:"Individual", it:"Individual" },
  "plan.duo": { en:"Duo", zh:"Duo", es:"Duo", fr:"Duo", de:"Duo", ja:"Duo", ko:"Duo", vi:"Duo", pt:"Duo", it:"Duo" },
  "plan.family": { en:"Family", zh:"Family", es:"Family", fr:"Family", de:"Family", ja:"Family", ko:"Family", vi:"Family", pt:"Family", it:"Family" },
  "plan.individualSub": { en:"1 premium profile", zh:"1 个会员用户", es:"1 perfil premium", fr:"1 profil premium", de:"1 Premium-Profil", ja:"プレミアム1人", ko:"프리미엄 1명", vi:"1 hồ sơ premium", pt:"1 perfil premium", it:"1 profilo premium" },
  "plan.duoSub": { en:"2 premium profiles", zh:"2 个会员用户", es:"2 perfiles premium", fr:"2 profils premium", de:"2 Premium-Profile", ja:"プレミアム2人", ko:"프리미엄 2명", vi:"2 hồ sơ premium", pt:"2 perfis premium", it:"2 profili premium" },
  "plan.familySub": { en:"Up to 5 profiles", zh:"最多 5 个用户", es:"Hasta 5 perfiles", fr:"Jusqu'à 5 profils", de:"Bis zu 5 Profile", ja:"最大5人", ko:"최대 5명", vi:"Tối đa 5 hồ sơ", pt:"Até 5 perfis", it:"Fino a 5 profili" },

  "up.heartsTitle": { en:"Out of hearts!", zh:"爱心用光啦！", es:"¡Sin vidas!", fr:"Plus de cœurs !", de:"Keine Herzen mehr!", ja:"ハートが切れた！", ko:"하트 다 떨어졌어!", vi:"Hết tim rồi!", pt:"Acabaram as vidas!", it:"Cuori finiti!" },
  "up.heartsBody": { en:"Take a breather and they'll refill in 4 hours — or go Premium for unlimited hearts and keep the streak alive now.", zh:"歇会儿，4 小时后自动回满——或者升级会员，无限爱心，连胜不断。", es:"Tómate un respiro y se recargan en 4 horas — o hazte Premium para vidas infinitas y no cortar la racha.", fr:"Souffle un peu, ils se rechargent en 4 h — ou passe Premium pour des cœurs illimités et garde ta série.", de:"Mach kurz Pause, in 4 Std. sind sie zurück — oder hol dir Premium für unbegrenzte Herzen und halt die Serie am Leben.", ja:"ひと休みすれば4時間で回復——またはプレミアムでハート無限、連続記録キープ。", ko:"잠깐 쉬면 4시간 뒤 다시 차요 — 아니면 프리미엄으로 하트 무제한, 연속 기록 이어가기.", vi:"Nghỉ chút là 4 tiếng sau đầy lại — hoặc lên Premium để tim vô hạn, giữ chuỗi luôn.", pt:"Dá um tempo e elas voltam em 4 horas — ou seja Premium pra vidas infinitas e manter a sequência.", it:"Fai una pausa e tornano in 4 ore — o passa a Premium per cuori illimitati e tieni viva la serie." },
  "up.lockedTitle": { en:"This one's Premium 🔒", zh:"这是会员专属 🔒", es:"Esta es Premium 🔒", fr:"Celle-ci est Premium 🔒", de:"Das ist Premium 🔒", ja:"これはプレミアム 🔒", ko:"이건 프리미엄이야 🔒", vi:"Cái này là Premium 🔒", pt:"Essa é Premium 🔒", it:"Questa è Premium 🔒" },
  "up.lockedBody": { en:"Unlock every level, every song and both course paths with Premium.", zh:"用会员解锁所有等级、所有歌曲和两条课程线。", es:"Desbloquea todos los niveles, canciones y ambas rutas con Premium.", fr:"Débloque tous les niveaux, morceaux et les deux parcours avec Premium.", de:"Mit Premium schaltest du alle Level, Songs und beide Lernpfade frei.", ja:"プレミアムで全レベル・全曲・両コースを解放。", ko:"프리미엄으로 모든 레벨, 모든 곡, 두 코스를 다 해제.", vi:"Mở khoá mọi cấp, mọi bài và cả hai lộ trình với Premium.", pt:"Libere todos os níveis, músicas e as duas trilhas com o Premium.", it:"Sblocca ogni livello, brano e entrambi i percorsi con Premium." },
  "up.trialTitle": { en:"Your trial's almost up ⏰", zh:"试用快到期啦 ⏰", es:"Tu prueba está por acabar ⏰", fr:"Ton essai touche à sa fin ⏰", de:"Dein Test endet bald ⏰", ja:"体験がもうすぐ終了 ⏰", ko:"체험이 곧 끝나요 ⏰", vi:"Bản dùng thử sắp hết ⏰", pt:"Seu teste está acabando ⏰", it:"La prova sta per finire ⏰" },
  "up.trialBody": { en:"Keep the streak alive! Stay Premium so your family doesn't lose any progress.", zh:"别让连胜断了！续费会员，全家进度一个都不丢。", es:"¡No cortes la racha! Sigue Premium para que tu familia no pierda el progreso.", fr:"Garde ta série ! Reste Premium pour que ta famille ne perde rien.", de:"Halt die Serie! Bleib Premium, damit deine Familie keinen Fortschritt verliert.", ja:"連続記録を守ろう！プレミアム継続で家族の進捗もそのまま。", ko:"연속 기록을 지켜요! 프리미엄을 유지해서 가족 진도를 잃지 않게.", vi:"Giữ chuỗi nào! Ở lại Premium để cả nhà không mất tiến độ.", pt:"Mantenha a sequência! Continue Premium pra família não perder o progresso.", it:"Tieni viva la serie! Resta Premium così la famiglia non perde i progressi." },
  "up.nextHeart": { en:"Next heart in", zh:"下一颗爱心还需", es:"Próxima vida en", fr:"Prochain cœur dans", de:"Nächstes Herz in", ja:"次のハートまで", ko:"다음 하트까지", vi:"Tim kế trong", pt:"Próxima vida em", it:"Prossimo cuore tra" },
  "up.goPremium": { en:"Go Premium", zh:"升级会员", es:"Hazte Premium", fr:"Passe Premium", de:"Premium holen", ja:"プレミアムへ", ko:"프리미엄 시작", vi:"Lên Premium", pt:"Seja Premium", it:"Passa a Premium" },
  "up.practiceFree": { en:"Practice for free instead", zh:"先免费练习", es:"Mejor practica gratis", fr:"Plutôt s'entraîner gratuitement", de:"Lieber gratis üben", ja:"無料で練習する", ko:"대신 무료로 연습", vi:"Luyện tập miễn phí thôi", pt:"Praticar de graça", it:"Esercitati gratis invece" },
  "up.maybeLater": { en:"Maybe later", zh:"以后再说", es:"Quizás luego", fr:"Plus tard", de:"Vielleicht später", ja:"あとで", ko:"나중에", vi:"Để sau", pt:"Talvez depois", it:"Forse dopo" },
  "up.heartsRefilled": { en:"Hearts refilled — practice is always free!", zh:"爱心已回满——练习永远免费！", es:"¡Vidas recargadas — practicar siempre es gratis!", fr:"Cœurs rechargés — l'entraînement est toujours gratuit !", de:"Herzen aufgefüllt — Üben ist immer gratis!", ja:"ハート回復——練習はいつでも無料！", ko:"하트 충전 완료 — 연습은 언제나 무료!", vi:"Đầy tim rồi — luyện tập luôn miễn phí!", pt:"Vidas recarregadas — praticar é sempre grátis!", it:"Cuori ricaricati — esercitarsi è sempre gratis!" },

  "ms.title": { en:"Manage subscription", zh:"管理订阅", es:"Gestionar suscripción", fr:"Gérer l'abonnement", de:"Abo verwalten", ja:"サブスク管理", ko:"구독 관리", vi:"Quản lý gói", pt:"Gerenciar assinatura", it:"Gestisci abbonamento" },
  "ms.currentPlan": { en:"Current plan", zh:"当前套餐", es:"Plan actual", fr:"Formule actuelle", de:"Aktueller Plan", ja:"現在のプラン", ko:"현재 플랜", vi:"Gói hiện tại", pt:"Plano atual", it:"Piano attuale" },
  "ms.noPlan": { en:"No active plan", zh:"无生效套餐", es:"Sin plan activo", fr:"Aucune formule active", de:"Kein aktiver Plan", ja:"有効なプランなし", ko:"활성 플랜 없음", vi:"Chưa có gói", pt:"Nenhum plano ativo", it:"Nessun piano attivo" },
  "ms.free": { en:"Free", zh:"免费版", es:"Gratis", fr:"Gratuit", de:"Gratis", ja:"無料", ko:"무료", vi:"Miễn phí", pt:"Grátis", it:"Gratis" },
  "ms.limited": { en:"Limited lessons & 5 hearts", zh:"有限课程 + 5 颗爱心", es:"Lecciones limitadas y 5 vidas", fr:"Leçons limitées et 5 cœurs", de:"Begrenzte Lektionen & 5 Herzen", ja:"レッスン制限 + ハート5", ko:"제한된 레슨 + 하트 5", vi:"Bài học giới hạn & 5 tim", pt:"Lições limitadas e 5 vidas", it:"Lezioni limitate e 5 cuori" },
  "ms.renews": { en:"Renews {date} · {price}/mo", zh:"{date} 续费 · {price}/月", es:"Se renueva el {date} · {price}/mes", fr:"Renouvellement le {date} · {price}/mois", de:"Verlängert {date} · {price}/Mon.", ja:"{date} に更新 · {price}/月", ko:"{date} 갱신 · {price}/월", vi:"Gia hạn {date} · {price}/tháng", pt:"Renova em {date} · {price}/mês", it:"Si rinnova il {date} · {price}/mese" },
  "ms.profilesUsing": { en:"Profiles using Premium", zh:"使用会员的用户", es:"Perfiles con Premium", fr:"Profils avec Premium", de:"Profile mit Premium", ja:"プレミアム利用プロフィール", ko:"프리미엄 사용 프로필", vi:"Hồ sơ đang dùng Premium", pt:"Perfis usando Premium", it:"Profili con Premium" },
  "ms.billing": { en:"Billing", zh:"账单", es:"Facturación", fr:"Facturation", de:"Abrechnung", ja:"請求", ko:"결제", vi:"Thanh toán", pt:"Cobrança", it:"Fatturazione" },
  "ms.annualNext": { en:"Annual · next charge {date}", zh:"年付 · 下次扣费 {date}", es:"Anual · próximo cargo {date}", fr:"Annuel · prochain débit {date}", de:"Jährlich · nächste Abbuchung {date}", ja:"年額 · 次回請求 {date}", ko:"연간 · 다음 결제 {date}", vi:"Năm · lần thu kế {date}", pt:"Anual · próxima cobrança {date}", it:"Annuale · prossimo addebito {date}" },
  "ms.payMethod": { en:"Payment method", zh:"支付方式", es:"Método de pago", fr:"Moyen de paiement", de:"Zahlungsart", ja:"お支払い方法", ko:"결제 수단", vi:"Phương thức thanh toán", pt:"Forma de pagamento", it:"Metodo di pagamento" },
  "ms.changePlan": { en:"Change plan", zh:"更换套餐", es:"Cambiar plan", fr:"Changer de formule", de:"Plan ändern", ja:"プラン変更", ko:"플랜 변경", vi:"Đổi gói", pt:"Mudar plano", it:"Cambia piano" },
  "ms.cancel": { en:"Cancel subscription", zh:"取消订阅", es:"Cancelar suscripción", fr:"Résilier l'abonnement", de:"Abo kündigen", ja:"サブスクを解約", ko:"구독 취소", vi:"Huỷ gói", pt:"Cancelar assinatura", it:"Disdici abbonamento" },
  "ms.cancelled": { en:"Subscription cancelled. Premium stays active until the renewal date.", zh:"订阅已取消。会员将持续到续费日期。", es:"Suscripción cancelada. El Premium sigue activo hasta la fecha de renovación.", fr:"Abonnement résilié. Le Premium reste actif jusqu'à la date de renouvellement.", de:"Abo gekündigt. Premium bleibt bis zum Verlängerungsdatum aktiv.", ja:"解約しました。更新日までプレミアムは有効です。", ko:"구독이 취소됐어요. 갱신일까지 프리미엄은 유지돼요.", vi:"Đã huỷ gói. Premium vẫn hoạt động tới ngày gia hạn.", pt:"Assinatura cancelada. O Premium fica ativo até a data de renovação.", it:"Abbonamento disdetto. Premium resta attivo fino alla data di rinnovo." },
  "ms.seePlans": { en:"See Premium plans", zh:"查看会员套餐", es:"Ver planes Premium", fr:"Voir les formules Premium", de:"Premium-Pläne ansehen", ja:"プレミアムプランを見る", ko:"프리미엄 플랜 보기", vi:"Xem các gói Premium", pt:"Ver planos Premium", it:"Vedi i piani Premium" },
});
