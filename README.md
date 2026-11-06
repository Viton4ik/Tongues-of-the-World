# Tongues of the World

**[English](#english) · [Русский](#русский)**

---

## English

### Tongues of the World: a 6-minute animated film

A browser-based motion film about how languages spread across the world: from the first humans leaving Africa to the present day. Built with HTML/CSS/JS, rendered on a live world map (D3 + TopoJSON). Music and sound effects are generated in the browser (Web Audio, no audio files).

### How to watch
- `index.html` is the player: ▶ / Space, seek on the timeline (chapter marks), ←/→ for 5 s, `F` fullscreen, `C` subtitles, `M` sound.
- `index.html#t=123` opens the film at 123 s; `#t=123&still` shows a still frame without UI (handy for previews and screen recording).
- `storyboard.html` is the storyboard: 29 key frames, click one to open the film at that moment. In a headless browser the preview iframes may not render; in a normal browser they work.
- To get an MP4: fullscreen at 1920×1080 + screen recording (OBS / QuickTime) with sound.

### Structure (6:00)
| # | Time | Chapter |
|---|---|---|
| 00 | 0:00 | Cold open: greetings, the "7,000+" counter, title |
| 01 | 0:22 | Where it all began: out of Africa, Proto-Indo-Europeans, "mother" in 7 languages |
| 02 | 1:02 | Cows, canoes & confidence: Bantu and Austronesians |
| 03 | 1:40 | Empire mode: ON: Rome (what it brought and took), Romance languages, Arabic and borrowed words |
| 04 | 2:26 | The English remix: Saxons, Vikings, Normans, cow/beef, word-origin chart |
| 05 | 3:10 | The Mongol exception: a huge empire, one word: "horde" |
| 06 | 3:30 | Age of sail & bad manners: Tordesillas, colonies, words from the Americas and India, Tok Pisin |
| 07 | 4:35 | Lost & found: living indigenous languages, gravestones, revived languages, the Latin ATM |
| 08 | 5:18 | The scoreboard: top languages, language "superpowers" |
| 09 | 5:46 | Outro: "Every word is a souvenir" |

### Files
- `index.html`: the player.
- `css/film.css`: styles and animations (fonts: Fraunces, Space Grotesk, Caveat from Google Fonts).
- `js/script-data.js`: **the whole timeline**: scenes, camera, country colours, arrows, pins, cards, subtitles. Timings are changed here.
- `js/film.js`: playback engine (deterministic: any frame is computed from time).
- `js/audio.js`: procedural music (104 BPM) and SFX.
- `storyboard.html`: storyboard.
- `docs/01-on-screen-text-timeline-en.md`: all on-screen text in English with timecodes.
- `docs/02-voiceover-script-en.md`: English voiceover script with timecodes, directing notes and a pronunciation guide.
- `docs/03-script-ru.md`: full script in Russian: what's on screen, voice, jokes.

### External resources
d3@7, topojson-client@3, world-atlas@2 (jsDelivr), flags from flagcdn.com, fonts from Google Fonts. Requires an internet connection.

### Data storage
None: the project is static, no database and no user data.

### What could be done next
- Record the voiceover from `docs/02-voiceover-script-en.md` and add it as an audio file (in sync with the timeline).
- Export to MP4 via screen recording.
- Publish (Hosted Deploy), only on request.

---

## Русский

### Tongues of the World: анимационный ролик на 6 минут

Моушн-ролик в браузере о том, как языки распространялись по миру: от выхода из Африки до наших дней. Сделан на HTML/CSS/JS, рендер на живой карте мира (D3 + TopoJSON), музыка и звуковые эффекты генерируются в браузере (Web Audio, без аудиофайлов).

### Как смотреть
- `index.html`: плеер. ▶ / пробел, перемотка по таймлайну (метки глав), ←/→ на 5 с, `F` полноэкранный режим, `C` субтитры, `M` звук.
- `index.html#t=123` открывает фильм со 123-й секунды; `#t=123&still` даёт стоп-кадр без интерфейса (удобно для превью и записи экрана).
- `storyboard.html`: раскадровка, 29 ключевых кадров, по клику открывается фильм с этого момента. В headless-браузере превью-iframe могут не отрисоваться, в обычном браузере работают.
- Чтобы получить MP4: полноэкранный режим 1920×1080 + запись экрана (OBS / QuickTime) со звуком.

### Структура ролика (6:00)
| # | Время | Глава |
|---|---|---|
| 00 | 0:00 | Холодное открытие: приветствия, счётчик «7 000+», титр |
| 01 | 0:22 | Where it all began: выход из Африки, праиндоевропейцы, «мать» на 7 языках |
| 02 | 1:02 | Cows, canoes & confidence: банту и австронезийцы |
| 03 | 1:40 | Empire mode: ON: Рим (принёс/забрал), романские языки, арабский и слова-«импорт» |
| 04 | 2:26 | The English remix: саксы, викинги, нормандцы, cow/beef, график происхождения слов |
| 05 | 3:10 | The Mongol exception: огромная империя, одно слово: «horde» |
| 06 | 3:30 | Age of sail & bad manners: Тордесильяс, колонии, слова из Америки и Индии, ток-писин |
| 07 | 4:35 | Lost & found: живые коренные языки, надгробия, возрождённые языки, латинский банкомат |
| 08 | 5:18 | The scoreboard: топ языков, языковые «сверхдержавы» |
| 09 | 5:46 | Outro: «Every word is a souvenir» |

### Файлы
- `index.html`: плеер.
- `css/film.css`: стили и анимации (шрифты Fraunces, Space Grotesk, Caveat из Google Fonts).
- `js/script-data.js`: **весь таймлайн**: сцены, камера, раскраска стран, стрелки, пины, карточки, субтитры. Тайминги меняются здесь.
- `js/film.js`: движок воспроизведения (детерминированный: любой кадр вычисляется из времени).
- `js/audio.js`: процедурная музыка (104 BPM) и звуковые эффекты.
- `storyboard.html`: раскадровка.
- `docs/01-on-screen-text-timeline-en.md`: весь текст в кадре на английском с таймкодами.
- `docs/02-voiceover-script-en.md`: сценарий озвучки на английском с таймкодами, режиссёрскими пометками и гидом по произношению.
- `docs/03-script-ru.md`: полный сценарий на русском: что в кадре, голос, шутки.

### Внешние ресурсы
d3@7, topojson-client@3, world-atlas@2 (jsDelivr), флаги с flagcdn.com, шрифты Google Fonts. Нужен интернет.

### Хранилище данных
Нет: проект статический, база данных и пользовательские данные не используются.

### Что можно сделать дальше
- Записать озвучку по `docs/02-voiceover-script-en.md` и подложить её аудиофайлом (синхронно с таймлайном).
- Экспортировать в MP4 записью экрана.
- Опубликовать (Hosted Deploy), только по вашему запросу.
