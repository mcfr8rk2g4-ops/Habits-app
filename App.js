import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, TextInput, Animated, Alert,
  StyleSheet, useColorScheme, SafeAreaView, Platform, StatusBar, Share, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Path, Rect, Circle, Ellipse, G } from 'react-native-svg';

const KEY = 'habits-rn-v1';
const STATE_KEY = 'habits-rn-extra-v2';
const INK = '#1d1b3a';

// ١٨ & ٢٠: باليتات ألوان إضافية تفتح مع المستويات + أيقونات إضافية
const THEMES = [
  { id: 'classic', name: 'كلاسيكي', lvl: 1, bgL: '#eceaff', bgD: '#17152e', cols: ['#ff8a7a', '#ffd54a', '#5fe0b7', '#7cc4ff', '#b79cff', '#ff9ccf'] },
  { id: 'sunset', name: 'غروب دافي', lvl: 3, bgL: '#fff0e6', bgD: '#26181c', cols: ['#ff7b6b', '#ffb84d', '#ff85a2', '#b388ff', '#64dfdf', '#ffd166'] },
  { id: 'forest', name: 'غابة هادية', lvl: 5, bgL: '#e6f7ef', bgD: '#12241d', cols: ['#52b788', '#74c69d', '#ffd166', '#4ea8de', '#95d5b2', '#f4a261'] },
  { id: 'royal', name: 'ملكي', lvl: 8, bgL: '#eef2ff', bgD: '#131736', cols: ['#7b2cbf', '#4cc9f0', '#f72585', '#ffd166', '#4361ee', '#06d6a0'] },
];

const DN = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const GC = {
  B: ['#8fd3ff', '#1f6fe0'], R: ['#ff9a8a', '#d6282a'], G: ['#8ef0c0', '#0f9d6b'],
  P: ['#cdb8ff', '#6a3de0'], Y: ['#ffe985', '#f0a500'], K: ['#ffb3da', '#e0407f'],
  W: ['#ffffff', '#bfc6e6'],
};
const EMO = { '💧': 'drop', '🏃': 'run', '📖': 'book', '🧘': 'lotus', '🍎': 'apple', '😴': 'moon', '💊': 'pill', '⭐': 'star', '🔥': 'flame', '🎯': 'target', '⚡': 'bolt', '🏆': 'trophy' };
const NAMES = ['drop', 'run', 'book', 'lotus', 'apple', 'moon', 'pill', 'star', 'flame', 'target', 'bolt', 'trophy'];

// ١٠ حيوانات أليفة تفتح مع الليفيل
const PETS = [
  { id: 'cat', name: 'قطة مشمش', unlockLvl: 1, body: 'G', ear: 'point', accent: '#ff9ccf' },
  { id: 'dog', name: 'كلب بندق', unlockLvl: 2, body: 'Y', ear: 'flop', accent: '#d6282a' },
  { id: 'bunny', name: 'أرنب سكر', unlockLvl: 3, body: 'W', ear: 'long', accent: '#ffb3da' },
  { id: 'fox', name: 'ثعلب كرمة', unlockLvl: 4, body: 'R', ear: 'point', accent: '#ffe985' },
  { id: 'panda', name: 'باندا ميشو', unlockLvl: 5, body: 'W', ear: 'round', accent: '#1d1b3a' },
  { id: 'frog', name: 'ضفدع نونو', unlockLvl: 6, body: 'G', ear: 'round', accent: '#8ef0c0' },
  { id: 'owl', name: 'بومة حكيم', unlockLvl: 7, body: 'P', ear: 'tuft', accent: '#ffd54a' },
  { id: 'penguin', name: 'بطريق ثلج', unlockLvl: 8, body: 'B', ear: 'round', accent: '#ff9a8a' },
  { id: 'dragon', name: 'تنين لهيب', unlockLvl: 9, body: 'K', ear: 'horn', accent: '#ffd54a' },
  { id: 'unicorn', name: 'يونيكورن حلم', unlockLvl: 10, body: 'P', ear: 'horn', accent: '#5fe0b7' },
];

// إكسسوارات وملابس للحيوانات
const WARDROBE = [
  { id: 'none', name: 'بدون إكسسوار', cost: 0, slot: 'none' },
  { id: 'scarf', name: 'وشاح دافي', cost: 60, slot: 'neck', color: '#ff8a7a' },
  { id: 'bowtie', name: 'بابيون أنيق', cost: 90, slot: 'neck', color: '#ffd54a' },
  { id: 'glasses', name: 'نظارة كول', cost: 130, slot: 'face', color: '#1d1b3a' },
  { id: 'hat', name: 'قبعة حفلة', cost: 180, slot: 'head', color: '#7cc4ff' },
  { id: 'crown', name: 'تاج ملكي', cost: 260, slot: 'head', color: '#ffd54a' },
];

// ٤: خلفيات وغرف للحيوان
const ROOMS = [
  { id: 'auto', name: 'تلقائي (حسب الوقت)', cost: 0 },
  { id: 'meadow', name: 'مرج أخضر', cost: 70 },
  { id: 'space', name: 'مجرة النجوم', cost: 140 },
  { id: 'beach', name: 'شاطئ الغروب', cost: 200 },
];

// ٢: أكل ومكافآت للحيوان
const TREATS = [
  { id: 'apple_t', name: '🍎 تفاحة طازة', cost: 20, bonusXp: 3, moodBoost: 'شبعان ومبسوط!' },
  { id: 'cake_t', name: '🧁 كب كيك', cost: 45, bonusXp: 8, moodBoost: 'طاير من الفرحة!' },
  { id: 'ball_t', name: '🎾 لعبة ممتعة', cost: 35, bonusXp: 6, moodBoost: 'نشيط جداً!' },
];

const pad = (n) => (n < 10 ? '0' : '') + n;
const dk = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const back = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const uid = () => Math.random().toString(36).slice(2, 9);

// ٩: يوم راحة يحمي الـ streak لو متسجل في restDays
const ok = (h, k, restDays = {}) => (h.days[k] || 0) >= h.t || !!restDays[k];

const streak = (h, restDays = {}) => {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const k = dk(back(i));
    if (ok(h, k, restDays)) n++;
    else if (i > 0) break;
  }
  return n;
};

const lvl = (tot) => Math.floor(Math.sqrt(tot / 10)) + 1;

function encodeHabitsPayload(habits, meta = {}) {
  const compact = habits.map((h) => ({
    n: h.name, e: h.e, c: h.c || 0, t: h.t || 1, note: h.note || '', rem: h.rem || '',
  }));
  return encodeURIComponent(JSON.stringify({ v: 2, habits: compact, meta }));
}

function decodeHabitsPayload(rawInput) {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) throw new Error('empty');
  let encodedPart = trimmed;
  const match = trimmed.match(/[?&]d=([^&\s]+)/) || trimmed.match(/share\/([^?\s]+)/);
  if (match && match[1]) encodedPart = match[1];
  const parsed = JSON.parse(decodeURIComponent(encodedPart));
  const list = Array.isArray(parsed) ? parsed : parsed.habits;
  if (!Array.isArray(list) || !list.length) throw new Error('invalid');
  const mapped = list.map((h) => ({
    id: uid(),
    name: String(h.n || h.name || '').slice(0, 30) || 'عادة',
    e: NAMES.includes(h.e) ? h.e : (EMO[h.e] || 'star'),
    c: typeof (h.c ?? h.color) === 'number' ? (h.c ?? h.color) : 0,
    t: Math.max(1, parseInt(h.t ?? h.target, 10) || 1),
    note: String(h.note || '').slice(0, 60),
    rem: String(h.rem || '').slice(0, 20),
    pinned: false,
    days: {},
  }));
  return { habits: mapped, meta: parsed.meta || null };
}

function Grads() {
  return (
    <Defs>
      {Object.keys(GC).map((k) => (
        <LinearGradient key={k} id={'g' + k} x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor={GC[k][0]} />
          <Stop offset="1" stopColor={GC[k][1]} />
        </LinearGradient>
      ))}
    </Defs>
  );
}

const ICONS = {
  drop: () => (<>
    <Path d="M24 4C24 4 9 21 9 31a15 15 0 0 0 30 0C39 21 24 4 24 4Z" fill="url(#gB)" />
    <Ellipse cx="17" cy="31" rx="3" ry="6.5" fill="#fff" opacity="0.55" transform="rotate(15 17 31)" />
  </>),
  run: () => (<>
    <Rect x="14" y="21" width="20" height="6" rx="3" fill="url(#gW)" />
    <Rect x="5" y="14" width="10" height="20" rx="4" fill="url(#gR)" />
    <Rect x="33" y="14" width="10" height="20" rx="4" fill="url(#gR)" />
  </>),
  book: () => (<>
    <Path d="M24 12C18 8 10 8 5 10v26c5-2 13-2 19 2Z" fill="url(#gP)" />
    <Path d="M24 12c6-4 14-4 19-2v26c-5-2-13-2-19 2Z" fill="url(#gW)" />
  </>),
  lotus: () => (<>
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" transform="rotate(-55 24 36)" />
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" transform="rotate(55 24 36)" />
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" />
  </>),
  apple: () => (<>
    <Path d="M24 14c-4-4-18-2-18 14 0 9 7 16 12 16 3 0 4-1 6-1s3 1 6 1c5 0 12-7 12-16 0-16-14-18-18-14Z" fill="url(#gR)" />
    <Path d="M24 14c0-5 2-8 6-9" stroke="#6a3d1e" strokeWidth="3" strokeLinecap="round" fill="none" />
  </>),
  moon: () => (<>
    <Path d="M31 6a19 19 0 1 0 12 28A15 15 0 0 1 31 6Z" fill="url(#gY)" />
  </>),
  pill: () => (
    <G transform="rotate(-45 24 24)">
      <Rect x="4" y="14" width="40" height="20" rx="10" fill="url(#gK)" />
      <Path d="M24 14h10a10 10 0 0 1 0 20H24Z" fill="url(#gW)" />
    </G>
  ),
  star: () => (<>
    <Path d="M24 4l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 19l14-2Z" fill="url(#gY)" stroke="#f0a500" strokeWidth="1" />
  </>),
  flame: () => (<>
    <Path d="M25 4c3 8-4 11-4 17 0 3 2 5 5 5 4 0 6-4 5-9 6 4 9 10 9 16a16 16 0 0 1-32 0c0-10 8-19 17-29Z" fill="url(#gR)" />
  </>),
  target: () => (<>
    <Circle cx="24" cy="24" r="18" fill="url(#gR)" />
    <Circle cx="24" cy="24" r="11" fill="url(#gW)" />
    <Circle cx="24" cy="24" r="5" fill="url(#gR)" />
  </>),
  bolt: () => (<>
    <Path d="M27 4L10 26h13l-2 18 17-22H25l2-18Z" fill="url(#gY)" />
  </>),
  trophy: () => (<>
    <Path d="M14 8h20v12a10 10 0 0 1-20 0V8Z" fill="url(#gY)" />
    <Rect x="21" y="29" width="6" height="8" fill="url(#gY)" />
    <Rect x="15" y="37" width="18" height="5" rx="2" fill="url(#gR)" />
  </>),
};

function Icon({ name, size = 44 }) {
  const Body = ICONS[name] || ICONS.star;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Grads />
      <Ellipse cx="24" cy="45" rx="14" ry="2.5" fill="#000" opacity="0.16" />
      <Body />
    </Svg>
  );
}

// ١، ٤، ٥: الحيوان الأليف + المزاج + التطور + الغرفة + الملابس
function PetAvatar({ petId, accessoryId, mood, evolved, roomId, size = 96 }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const speed = mood === 'excited' ? 650 : mood === 'sleepy' ? 1700 : 1100;
    const amp = mood === 'excited' ? -7 : mood === 'sleepy' ? -2 : -4;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: amp, duration: speed, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: speed, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);

  const pet = PETS.find((p) => p.id === petId) || PETS[0];
  const acc = WARDROBE.find((w) => w.id === accessoryId) || WARDROBE[0];
  const fillUrl = `url(#g${pet.body})`;
  const strokeMain = pet.body === 'W' ? '#8c94b8' : INK;

  const hr = new Date().getHours();
  const autoRoom = hr >= 6 && hr < 17 ? 'meadow' : hr >= 17 && hr < 20 ? 'beach' : 'space';
  const activeRoom = roomId === 'auto' ? autoRoom : roomId;

  return (
    <Animated.View style={{ transform: [{ translateY: bob }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Grads />
        {/* ٤: خلفية الغرفة */}
        {activeRoom === 'meadow' && <Circle cx="50" cy="52" r="45" fill="#5fe0b7" opacity="0.22" />}
        {activeRoom === 'beach' && <Circle cx="50" cy="52" r="45" fill="#ff9a8a" opacity="0.24" />}
        {activeRoom === 'space' && (
          <G>
            <Circle cx="50" cy="52" r="45" fill="#6a3de0" opacity="0.25" />
            <Circle cx="20" cy="24" r="2" fill="#ffd54a" />
            <Circle cx="80" cy="22" r="2.5" fill="#ffd54a" />
            <Circle cx="76" cy="76" r="1.8" fill="#fff" />
          </G>
        )}

        {/* ٥: هالة التطور لما يقرب من الليفيل الجاي أو يخلص بدري */}
        {evolved && <Circle cx="50" cy="56" r="40" stroke="#ffd54a" strokeWidth="2.5" strokeDasharray="5 4" fill="none" />}

        <Ellipse cx="50" cy="93" rx="26" ry="4" fill="#000" opacity="0.2" />

        {pet.ear === 'point' && (<>
          <Path d="M26 42L22 18L40 32Z" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
          <Path d="M74 42L78 18L60 32Z" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
        </>)}
        {pet.ear === 'flop' && (<>
          <Ellipse cx="22" cy="54" rx="9" ry="18" fill={fillUrl} stroke={strokeMain} strokeWidth="2" transform="rotate(12 22 54)" />
          <Ellipse cx="78" cy="54" rx="9" ry="18" fill={fillUrl} stroke={strokeMain} strokeWidth="2" transform="rotate(-12 78 54)" />
        </>)}
        {pet.ear === 'long' && (<>
          <Ellipse cx="36" cy="24" rx="7" ry="19" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
          <Ellipse cx="64" cy="24" rx="7" ry="19" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
          <Ellipse cx="36" cy="25" rx="3" ry="12" fill={pet.accent} opacity="0.65" />
          <Ellipse cx="64" cy="25" rx="3" ry="12" fill={pet.accent} opacity="0.65" />
        </>)}
        {pet.ear === 'round' && (<>
          <Circle cx="27" cy="31" r="10" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
          <Circle cx="73" cy="31" r="10" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
        </>)}
        {pet.ear === 'tuft' && (<>
          <Path d="M26 36L20 22L36 30Z" fill={fillUrl} />
          <Path d="M74 36L80 22L64 30Z" fill={fillUrl} />
        </>)}
        {pet.ear === 'horn' && (<>
          <Path d="M50 26L45 8L56 24Z" fill="#ffd54a" stroke={INK} strokeWidth="1.8" />
          <Circle cx="28" cy="34" r="7" fill={fillUrl} />
          <Circle cx="72" cy="34" r="7" fill={fillUrl} />
        </>)}

        <Ellipse cx="50" cy="58" rx="30" ry="28" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
        <Ellipse cx="40" cy="41" rx="8" ry="4.5" fill="#fff" opacity="0.4" />

        {pet.id === 'panda' && (<>
          <Circle cx="38" cy="54" r="7" fill={INK} />
          <Circle cx="62" cy="54" r="7" fill={INK} />
        </>)}

        <Circle cx="31" cy="64" r="4.5" fill={pet.accent} opacity="0.7" />
        <Circle cx="69" cy="64" r="4.5" fill={pet.accent} opacity="0.7" />

        {/* ١: تعبير العينين والفم حسب المزاج */}
        {acc.id === 'glasses' ? (
          <G>
            <Rect x="31" y="48" width="15" height="11" rx="4" fill="#1d1b3a" stroke="#fff" strokeWidth="2" />
            <Rect x="54" y="48" width="15" height="11" rx="4" fill="#1d1b3a" stroke="#fff" strokeWidth="2" />
            <Path d="M46 53h8" stroke="#fff" strokeWidth="2.5" />
          </G>
        ) : mood === 'sleepy' ? (
          <G>
            <Path d="M34 55q5 4 10 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <Path d="M56 55q5 4 10 0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </G>
        ) : (<>
          <Circle cx="39" cy="54" r="5" fill="#fff" />
          <Circle cx="61" cy="54" r="5" fill="#fff" />
          <Circle cx="40" cy="55" r="2.7" fill={INK} />
          <Circle cx="62" cy="55" r="2.7" fill={INK} />
        </>)}

        {mood === 'excited'
          ? <Path d="M41 65q9 13 18 0Z" fill={INK} />
          : mood === 'sleepy'
            ? <Circle cx="50" cy="68" r="3" fill={INK} />
            : <Path d="M43 67q7 5 14 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />}

        {acc.slot === 'neck' && (
          <G>
            <Rect x="28" y="80" width="44" height="9" rx="4.5" fill={acc.color} stroke={INK} strokeWidth="1.8" />
            {acc.id === 'bowtie' && (
              <Path d="M42 84L34 79v10l8-5zm16 0l8-5v10l-8-5z" fill="#ff9ccf" stroke={INK} strokeWidth="1.5" />
            )}
          </G>
        )}
        {acc.id === 'hat' && (
          <Path d="M50 8L33 32h34L50 8Z" fill={acc.color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        )}
        {acc.id === 'crown' && (
          <Path d="M32 30l5-14 13 8 13-8 5 14H32Z" fill={acc.color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        )}
      </Svg>
    </Animated.View>
  );
}

// ١٠، ١١، ١٣، ١٦: كارت العادة (تثبيت + تعديل + ملاحظة + تذكير + مشاركة عادة واحدة)
function Card({ h, idx, cols, today, restDays, onTap, onEdit, onPin, onShareOne, onLong }) {
  const c = h.days[today] || 0;
  const fin = c >= h.t || !!restDays[today];
  const s = streak(h, restDays);
  return (
    <Pressable onLongPress={() => onLong(h)} style={[st.card, { backgroundColor: cols[(h.c || idx) % cols.length] }]}>
      <View style={st.row}>
        <View style={st.emo}><Icon name={h.e} size={44} /></View>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <View style={st.row}>
            <Text style={st.nm}>{h.pinned ? '📌 ' : ''}{h.name}</Text>
          </View>
          <Text style={st.meta}>
            {restDays[today] ? 'يوم راحة محمي 🛡️' : s ? `${s} يوم ورا بعض` : h.t > 1 ? `النهارده ${c} من ${h.t}` : 'ابدأ النهارده'}
            {h.rem ? ` · ⏰ ${h.rem}` : ''}
          </Text>
          {!!h.note && <Text style={st.noteTxt}>📝 {h.note}</Text>}
        </View>
        <Pressable
          onPress={() => onTap(h)}
          style={({ pressed }) => [st.big, fin && { backgroundColor: INK }, pressed && st.bigDown]}
        >
          <Text style={[st.bigTxt, fin && { color: '#fff' }]}>{fin ? '✓' : h.t > 1 ? `${c}/${h.t}` : '+'}</Text>
        </Pressable>
      </View>

      {/* شريط أدوات سريع للكارت */}
      <View style={[st.row, { justifyContent: 'flex-start', gap: 8, marginTop: 8 }]}>
        <Pressable onPress={() => onPin(h)} style={st.miniBtn}><Text style={st.miniBtnTxt}>{h.pinned ? 'إلغاء التثبيت' : '📌 تثبيت'}</Text></Pressable>
        <Pressable onPress={() => onEdit(h)} style={st.miniBtn}><Text style={st.miniBtnTxt}>✏️ تعديل</Text></Pressable>
        <Pressable onPress={() => onShareOne(h)} style={st.miniBtn}><Text style={st.miniBtnTxt}>🔗 مشاركة</Text></Pressable>
      </View>

      <View style={st.track}><View style={[st.fill, { width: `${Math.min((restDays[today] ? h.t : c) / h.t, 1) * 100}%` }]} /></View>
      <View style={st.row}>
        {[6, 5, 4, 3, 2, 1, 0].map((i) => {
          const d = back(i), k = dk(d), n = h.days[k] || 0;
          const isDone = n >= h.t || !!restDays[k];
          return (
            <View key={i} style={[st.wd, isDone && { backgroundColor: INK }, n > 0 && !isDone && { backgroundColor: 'rgba(255,255,255,0.95)' }, i === 0 && st.today]}>
              <Text style={[st.wdTxt, isDone && { color: '#fff' }]}>{isDone ? '✓' : DN[d.getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  const [habits, setHabits] = useState([]);
  const [extra, setExtra] = useState({
    activePet: 'cat',
    activeAcc: 'none',
    unlockedAcc: ['none'],
    activeRoom: 'auto',
    unlockedRooms: ['auto'],
    themeId: 'classic',
    spentPts: 0,
    bonusXp: 0,
    hapticsOn: true,
    restDays: {},
    treatMsg: '',
  });
  const [ready, setReady] = useState(false);

  // ١٢ & ٢١: تصفية ووضع التركيز
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'remaining' | 'focus'
  const [focusIdx, setFocusIdx] = useState(0);

  // المودالات
  const [formModal, setFormModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [impModal, setImpModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null); // ١٤ & ١٥: معاينة واختيار من اللينك
  const [selectedImportIds, setSelectedImportIds] = useState({});
  const [petModal, setPetModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false); // ٣، ٧، ١٧، ١٨، ١٩

  // حقول الفورم (إضافة أو تعديل)
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('drop');
  const [cnt, setCnt] = useState(1);
  const [note, setNote] = useState('');
  const [rem, setRem] = useState('');
  const [txt, setTxt] = useState('');
  const today = dk(back(0));

  const buzz = (type = 'sel') => {
    if (!extra.hapticsOn) return;
    if (type === 'ok') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'med') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.selectionAsync();
  };

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(STATE_KEY)])
      .then(([rHabits, rExtra]) => {
        if (rHabits) setHabits(JSON.parse(rHabits));
        if (rExtra) setExtra((prev) => ({ ...prev, ...JSON.parse(rExtra) }));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(habits)).catch(() => {});
  }, [habits, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STATE_KEY, JSON.stringify(extra)).catch(() => {});
  }, [extra, ready]);

  // استقبال رابط مشاركة عادات أو تحدي
  const openImportPreviewFromText = (rawUrlOrText) => {
    const { habits: mapped, meta } = decodeHabitsPayload(rawUrlOrText);
    const sel = {};
    mapped.forEach((m) => { sel[m.id] = true; });
    setSelectedImportIds(sel);
    setImportPreview({ habits: mapped, meta });
    setImpModal(true);
  };

  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (!url || (!url.includes('d=') && !url.includes('share'))) return;
      try {
        openImportPreviewFromText(url);
      } catch (_) {}
    };
    Linking.getInitialURL().then((u) => { if (u) handleUrl({ url: u }); }).catch(() => {});
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // حساب النقاط والمستوى والإحصائيات
  let act = 0, done = 0, tot = extra.bonusXp || 0, bestStreak = 0;
  habits.forEach((h) => {
    act++;
    if (ok(h, today, extra.restDays)) done++;
    const s = streak(h, extra.restDays);
    if (s > bestStreak) bestStreak = s;
    Object.keys(h.days).forEach((k) => { tot += h.days[k]; });
  });

  const L = lvl(tot), cu = 10 * (L - 1) * (L - 1), nx = 10 * L * L;
  const totalPts = tot * 10;
  const availablePts = Math.max(0, totalPts - (extra.spentPts || 0));

  const themeObj = THEMES.find((t) => t.id === extra.themeId && L >= t.lvl) || THEMES[0];
  const th = dark
    ? { bg: themeObj.bgD, card: '#24214a', ink: '#eceaff', mute: '#a3a0cc', field: '#1a1838' }
    : { bg: themeObj.bgL, card: '#ffffff', ink: INK, mute: '#6d6a96', field: '#f1efff' };

  const currentPetObj = PETS.find((p) => p.id === extra.activePet) || PETS[0];
  const effectivePetId = L >= currentPetObj.unlockLvl ? currentPetObj.id : 'cat';

  // ١، ٥، ٦: مزاج الحيوان وتطوره ورسالته
  const hrNow = new Date().getHours();
  const petMood = act > 0 && done === act ? 'excited' : (hrNow >= 21 && done < act) ? 'sleepy' : 'normal';
  const nearNextLvl = (tot - cu) / Math.max(1, nx - cu) >= 0.75 || (act > 0 && done === act);
  const petSpeech = extra.treatMsg
    ? extra.treatMsg
    : !act
      ? 'يلا نضيف أول عادة سوا!'
      : done === act
        ? 'بطل! خلّصت كل عاداتك النهارده 🎉'
        : done === 0
          ? 'مستنيك نبدأ بأول خطوة النهارده 💪'
          : `عاش! فاضلك ${act - done} وتقفل اليوم`;

  // ٣: الأوسمة والإنجازات
  const badges = [
    { id: 'b1', title: 'أول خطوة', desc: 'أضف أول عادة', unlocked: habits.length >= 1 },
    { id: 'b2', title: 'التزام 7 أيام', desc: 'وصلت لـ 7 أيام ورا بعض', unlocked: bestStreak >= 7 },
    { id: 'b3', title: 'بطل الشهر', desc: 'وصلت لـ 30 يوم ورا بعض', unlocked: bestStreak >= 30 },
    { id: 'b4', title: 'مستوى 5', desc: 'فتحت 5 حيوانات', unlocked: L >= 5 },
    { id: 'b5', title: 'أسطورة الـ 10', desc: 'فتحت كل الـ 10 حيوانات', unlocked: L >= 10 },
  ];

  // ٧: إحصائيات الأسبوع
  const weekStats = [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const d = back(i);
    const k = dk(d);
    let completedCount = 0;
    habits.forEach((h) => { if (ok(h, k, extra.restDays)) completedCount++; });
    return { label: DN[d.getDay()], count: completedCount, total: habits.length };
  });

  // ١٠، ١٢، ٢١: ترتيب وتصفية العادات
  const sortedHabits = [...habits].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const filteredHabits = filterMode === 'remaining'
    ? sortedHabits.filter((h) => !ok(h, today, extra.restDays))
    : sortedHabits;
  const visibleHabits = filterMode === 'focus' && filteredHabits.length
    ? [filteredHabits[focusIdx % filteredHabits.length]]
    : filteredHabits;

  // إضافة / تعديل عادة
  const openAddModal = () => {
    setEditingHabit(null);
    setName(''); setIcon('drop'); setCnt(1); setNote(''); setRem('');
    setFormModal(true);
  };
  const openEditModal = (h) => {
    setEditingHabit(h);
    setName(h.name); setIcon(h.e); setCnt(h.t); setNote(h.note || ''); setRem(h.rem || '');
    setFormModal(true);
  };
  const saveHabit = () => {
    const n = name.trim();
    if (!n) return;
    if (editingHabit) {
      setHabits((hs) => hs.map((x) => (x.id === editingHabit.id
        ? { ...x, name: n.slice(0, 30), e: icon, t: cnt, note: note.trim().slice(0, 60), rem: rem.trim().slice(0, 20) }
        : x)));
    } else {
      setHabits((hs) => [...hs, {
        id: uid(), name: n.slice(0, 30), e: icon, c: hs.length % themeObj.cols.length,
        t: cnt, note: note.trim().slice(0, 60), rem: rem.trim().slice(0, 20), pinned: false, days: {},
      }]);
    }
    setFormModal(false);
    buzz('ok');
  };

  const tap = (h) => {
    const c = h.days[today] || 0;
    const days = { ...h.days };
    if (c >= h.t) {
      delete days[today];
      buzz('sel');
    } else {
      days[today] = c + 1;
      if (c + 1 >= h.t) buzz('ok');
      else buzz('med');
    }
    setExtra((prev) => ({ ...prev, treatMsg: '' }));
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, days } : x)));
  };

  const togglePin = (h) => {
    buzz('sel');
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, pinned: !x.pinned } : x)));
  };

  const longPress = (h) => {
    buzz('heavy');
    Alert.alert('حذف عادة', `تحذف "${h.name}"؟`, [
      { text: 'لأ', style: 'cancel' },
      { text: 'أيوه', style: 'destructive', onPress: () => setHabits((hs) => hs.filter((x) => x.id !== h.id)) },
    ]);
  };

  // ٩: تفعيل يوم راحة لحماية الـ Streak
  const toggleRestDay = () => {
    buzz('ok');
    setExtra((prev) => {
      const nextRest = { ...(prev.restDays || {}) };
      if (nextRest[today]) delete nextRest[today];
      else nextRest[today] = true;
      return { ...prev, restDays: nextRest };
    });
  };

  // ١٤، ١٦، ١٧: مشاركة الكل / تحدي / عادة واحدة / كارت إنجاز
  const shareAllOrChallenge = async (isChallenge = false) => {
    if (!habits.length) {
      Alert.alert('مفيش عادات', 'أضف عادة واحدة على الأقل الأول.');
      return;
    }
    const payload = encodeHabitsPayload(habits, { challenge: isChallenge, senderLvl: L, senderDone: done, senderAct: act });
    const link = `expohabits://share?d=${payload}`;
    const header = isChallenge
      ? `🔥 تحدي عادات! أنا في مستوى ${L} ومخلّص ${done}/${act} النهارده. تقدر تنافسني؟`
      : `🔗 جرّب نفس عاداتي في تطبيق عاداتي:`;
    try {
      buzz('sel');
      await Share.share({ message: `${header}\n${link}`, url: link });
    } catch (_) {}
  };

  const shareSingleHabit = async (h) => {
    const payload = encodeHabitsPayload([h], { single: true });
    const link = `expohabits://share?d=${payload}`;
    try {
      buzz('sel');
      await Share.share({ message: `✨ جرب معايا عادة "${h.name}" (${h.t} مرة يومياً):\n${link}`, url: link });
    } catch (_) {}
  };

  const shareSummaryCard = async () => {
    const petName = currentPetObj.name;
    const summaryText = `🏆 بطاقة إنجازي في تطبيق عاداتي\n⭐ المستوى: ${L}\n🔥 أطول التزام: ${bestStreak} يوم\n🐾 رفيقي: ${petName}\n✅ إنجاز اليوم: ${done}/${act}`;
    try {
      buzz('ok');
      await Share.share({ message: summaryText });
    } catch (_) {}
  };

  const parsePastedLink = () => {
    try {
      openImportPreviewFromText(txt);
    } catch (_) {
      Alert.alert('خطأ', 'اللينك أو الكود ده مش مظبوط. اتأكد إنك نسخته كامل.');
    }
  };

  const confirmSelectedImport = () => {
    if (!importPreview) return;
    const chosen = importPreview.habits.filter((h) => selectedImportIds[h.id]);
    if (!chosen.length) {
      Alert.alert('اختار عادة', 'علّم على عادة واحدة على الأقل لإضافتها.');
      return;
    }
    setHabits((hs) => [...hs, ...chosen]);
    setImportPreview(null);
    setImpModal(false);
    setTxt('');
    buzz('ok');
    Alert.alert('تمت الإضافة', `اتضافت ${chosen.length} عادة بنجاح!`);
  };

  // ٢: إطعام الحيوان
  const giveTreat = (treat) => {
    if (availablePts < treat.cost) {
      Alert.alert('نقاط غير كافية', `محتاج ${treat.cost} نقطة (معاك ${availablePts}).`);
      return;
    }
    buzz('ok');
    setExtra((prev) => ({
      ...prev,
      spentPts: (prev.spentPts || 0) + treat.cost,
      bonusXp: (prev.bonusXp || 0) + treat.bonusXp,
      treatMsg: `${treat.name}: ${treat.moodBoost} (+${treat.bonusXp} XP)`,
    }));
  };

  return (
    <SafeAreaView style={[st.flex, { backgroundColor: th.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* الهيدر مع زر الإحصائيات والإعدادات */}
        <View style={[st.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
          <Text style={[st.h1, { color: th.ink, marginBottom: 0 }]}>عاداتي</Text>
          <View style={[st.row, { gap: 8 }]}>
            <Pressable onPress={toggleRestDay} style={[st.topPill, { backgroundColor: extra.restDays[today] ? '#5fe0b7' : th.card }]}>
              <Text style={[st.topPillTxt, { color: extra.restDays[today] ? INK : th.ink }]}>🛡️ راحة</Text>
            </Pressable>
            <Pressable onPress={() => { buzz('sel'); setStatsModal(true); }} style={[st.topPill, { backgroundColor: th.card }]}>
              <Text style={[st.topPillTxt, { color: th.ink }]}>📊 الإحصائيات</Text>
            </Pressable>
          </View>
        </View>

        {/* بانر الحيوان الأليف + الرسالة + المستوى */}
        <Pressable onPress={() => { buzz('sel'); setPetModal(true); }} style={[st.hero, { backgroundColor: th.ink }]}>
          <View style={st.row}>
            <PetAvatar
              petId={effectivePetId}
              accessoryId={extra.activeAcc}
              mood={petMood}
              evolved={nearNextLvl}
              roomId={extra.activeRoom}
              size={98}
            />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[st.heroTxt, { color: th.bg }]}>{petSpeech}</Text>
              <View style={st.bar}><View style={[st.barFill, { width: `${act ? (done / act) * 100 : 0}%`, backgroundColor: '#ffd54a' }]} /></View>
              <Text style={[st.lvTxt, { color: th.bg }]}>
                مستوى {L} · {availablePts} نقطة · {currentPetObj.name}
              </Text>
              <View style={st.bar}><View style={[st.barFill, { width: `${Math.min(100, Math.max(0, ((tot - cu) / Math.max(1, nx - cu)) * 100))}%`, backgroundColor: '#5fe0b7' }]} /></View>
              <Text style={st.petHint}>🐾 اضغط للحيوانات (١٠) · الملابس · الأكل · الغرفة</Text>
            </View>
          </View>
        </Pressable>

        {/* ١٢ & ٢١: شريط التصفية ووضع التركيز */}
        {habits.length > 0 && (
          <View style={[st.row, { gap: 8, marginBottom: 14 }]}>
            {[
              { id: 'all', label: `الكل (${habits.length})` },
              { id: 'remaining', label: `الباقي (${Math.max(0, act - done)})` },
              { id: 'focus', label: '🎯 وضع التركيز' },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => { buzz('sel'); setFilterMode(tab.id); }}
                style={[st.filterChip, { backgroundColor: filterMode === tab.id ? th.ink : th.card }]}
              >
                <Text style={{ color: filterMode === tab.id ? th.bg : th.ink, fontWeight: '800', fontSize: 13 }}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {filterMode === 'focus' && filteredHabits.length > 1 && (
          <Pressable onPress={() => { buzz('sel'); setFocusIdx((i) => i + 1); }} style={[st.nextFocusBtn, { backgroundColor: th.card }]}>
            <Text style={{ color: th.ink, fontWeight: '800' }}>العادة التالية في وضع التركيز ⬅️</Text>
          </Pressable>
        )}

        {visibleHabits.map((h, i) => (
          <Card
            key={h.id}
            h={h}
            idx={i}
            cols={themeObj.cols}
            today={today}
            restDays={extra.restDays}
            onTap={tap}
            onEdit={openEditModal}
            onPin={togglePin}
            onShareOne={shareSingleHabit}
            onLong={longPress}
          />
        ))}
        {!habits.length && <Text style={[st.empty, { color: th.mute }]}>مفيش عادات لسه. دوس على الزرار الأصفر تحت.</Text>}
        {habits.length > 0 && !visibleHabits.length && (
          <Text style={[st.empty, { color: th.mute }]}>خلصت كل عاداتك النهارده! 🎉</Text>
        )}

        {/* ١٤ & ١٥: أزرار المشاركة والتحدي والاستيراد */}
        <View style={[st.row, { gap: 10, marginTop: 8 }]}>
          <Pressable onPress={() => shareAllOrChallenge(false)} style={[st.shareBtn, { flex: 1, backgroundColor: th.card, borderColor: th.ink }]}>
            <Text style={[st.shareTxt, { color: th.ink }]}>🔗 مشاركة عاداتي</Text>
          </Pressable>
          <Pressable onPress={() => shareAllOrChallenge(true)} style={[st.shareBtn, { flex: 1, backgroundColor: th.card, borderColor: '#e0407f' }]}>
            <Text style={[st.shareTxt, { color: '#e0407f' }]}>🔥 تحدي صديق</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => { setImportPreview(null); setImpModal(true); }} style={st.link}>
          <Text style={{ color: th.mute, fontWeight: '700' }}>استيراد أو مقارنة من لينك</Text>
        </Pressable>
        <Text style={[st.dev, { color: th.mute }]}>تطوير: محمد سامح</Text>
      </ScrollView>

      <Pressable onPress={() => { buzz('sel'); openAddModal(); }} style={({ pressed }) => [st.fab, pressed && st.fabDown]}>
        <Text style={st.fabTxt}>＋ عادة جديدة</Text>
      </Pressable>

      {/* مودال الحيوانات الـ ١٠ + الملابس + الأكل + الغرفة */}
      <Modal visible={petModal} transparent animationType="slide" onRequestClose={() => setPetModal(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[st.h2, { color: th.ink }]}>عالم الحيوانات الأليفة</Text>
              <Text style={[st.subNote, { color: th.mute }]}>المستوى: {L} · النقاط المتاحة: {availablePts}</Text>

              <Text style={[st.lab, { color: th.mute }]}>١. الحيوانات الـ ١٠ (تفتح مع المستوى)</Text>
              <View style={st.wrap}>
                {PETS.map((p) => {
                  const unlocked = L >= p.unlockLvl;
                  const selected = effectivePetId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        if (!unlocked) { Alert.alert('مقفول', `يفتح في مستوى ${p.unlockLvl}`); return; }
                        buzz('sel');
                        setExtra((prev) => ({ ...prev, activePet: p.id }));
                      }}
                      style={[st.petTile, { backgroundColor: th.field, opacity: unlocked ? 1 : 0.5 }, selected && { borderColor: th.ink, borderWidth: 2.5 }]}
                    >
                      <PetAvatar petId={p.id} accessoryId={selected ? extra.activeAcc : 'none'} mood="normal" evolved={false} roomId="auto" size={56} />
                      <Text style={[st.tileTitle, { color: th.ink }]} numberOfLines={1}>{p.name}</Text>
                      <Text style={[st.tileSub, { color: unlocked ? '#0f9d6b' : th.mute }]}>{unlocked ? (selected ? 'مفعّل' : 'مفتوح') : `مستوى ${p.unlockLvl}`}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[st.lab, { color: th.mute }]}>٢. إكسسوارات وملابس</Text>
              <View style={st.wrap}>
                {WARDROBE.map((item) => {
                  const unlocked = extra.unlockedAcc.includes(item.id);
                  const equipped = extra.activeAcc === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (unlocked) { buzz('sel'); setExtra((prev) => ({ ...prev, activeAcc: item.id })); return; }
                        if (availablePts < item.cost) { Alert.alert('نقاط غير كافية', `محتاج ${item.cost} نقطة`); return; }
                        buzz('ok');
                        setExtra((prev) => ({ ...prev, spentPts: prev.spentPts + item.cost, unlockedAcc: [...prev.unlockedAcc, item.id], activeAcc: item.id }));
                      }}
                      style={[st.accTile, { backgroundColor: th.field }, equipped && { borderColor: th.ink, borderWidth: 2.5 }]}
                    >
                      <Text style={[st.tileTitle, { color: th.ink }]}>{item.name}</Text>
                      <Text style={[st.tileSub, { color: equipped ? '#1f6fe0' : th.mute }]}>{equipped ? 'مرتديه ✓' : unlocked ? 'ارتداء' : `${item.cost} نقطة`}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[st.lab, { color: th.mute }]}>٣. أكل ومكافآت (تزود XP)</Text>
              <View style={st.wrap}>
                {TREATS.map((tr) => (
                  <Pressable key={tr.id} onPress={() => giveTreat(tr)} style={[st.petTile, { backgroundColor: th.field }]}>
                    <Text style={[st.tileTitle, { color: th.ink }]}>{tr.name}</Text>
                    <Text style={[st.tileSub, { color: '#e0407f' }]}>{tr.cost} نقطة (+{tr.bonusXp} XP)</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[st.lab, { color: th.mute }]}>٤. غرفة الحيوان</Text>
              <View style={st.wrap}>
                {ROOMS.map((rm) => {
                  const unlocked = extra.unlockedRooms.includes(rm.id);
                  const active = extra.activeRoom === rm.id;
                  return (
                    <Pressable
                      key={rm.id}
                      onPress={() => {
                        if (unlocked) { buzz('sel'); setExtra((prev) => ({ ...prev, activeRoom: rm.id })); return; }
                        if (availablePts < rm.cost) { Alert.alert('نقاط غير كافية', `محتاج ${rm.cost} نقطة`); return; }
                        buzz('ok');
                        setExtra((prev) => ({ ...prev, spentPts: prev.spentPts + rm.cost, unlockedRooms: [...prev.unlockedRooms, rm.id], activeRoom: rm.id }));
                      }}
                      style={[st.accTile, { backgroundColor: th.field }, active && { borderColor: th.ink, borderWidth: 2.5 }]}
                    >
                      <Text style={[st.tileTitle, { color: th.ink }]}>{rm.name}</Text>
                      <Text style={[st.tileSub, { color: active ? '#0f9d6b' : th.mute }]}>{active ? 'مفعّلة ✓' : unlocked ? 'اختيار' : `${rm.cost} نقطة`}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => setPetModal(false)} style={[st.go, { backgroundColor: th.ink }]}>
                <Text style={[st.goTxt, { color: th.bg }]}>تم</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* مودال الإحصائيات والأوسمة والثيمات والإعدادات */}
      <Modal visible={statsModal} transparent animationType="slide" onRequestClose={() => setStatsModal(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[st.h2, { color: th.ink }]}>الإحصائيات والأوسمة</Text>

              {/* ٧: الرسم البياني الأسبوعي */}
              <Text style={[st.lab, { color: th.mute }]}>التزام آخر ٧ أيام (أطول سلسلة: {bestStreak} يوم)</Text>
              <View style={[st.row, { justifyContent: 'space-between', alignItems: 'flex-end', height: 110, backgroundColor: th.field, borderRadius: 18, padding: 12 }]}>
                {weekStats.map((w, idx) => {
                  const pct = w.total ? Math.round((w.count / w.total) * 100) : 0;
                  return (
                    <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 16, height: Math.max(8, pct * 0.65), backgroundColor: pct === 100 ? '#0f9d6b' : '#7cc4ff', borderRadius: 8 }} />
                      <Text style={{ color: th.ink, fontSize: 12, fontWeight: '800', marginTop: 6 }}>{w.label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ١٧: مشاركة كارت الإنجاز */}
              <Pressable onPress={shareSummaryCard} style={[st.shareBtn, { backgroundColor: '#ffd54a', borderColor: INK, marginTop: 14 }]}>
                <Text style={[st.shareTxt, { color: INK }]}>🏅 مشاركة بطاقة إنجازي</Text>
              </Pressable>

              {/* ٣: الأوسمة */}
              <Text style={[st.lab, { color: th.mute }]}>الأوسمة</Text>
              <View style={st.wrap}>
                {badges.map((b) => (
                  <View key={b.id} style={[st.accTile, { backgroundColor: th.field, opacity: b.unlocked ? 1 : 0.45 }]}>
                    <Text style={[st.tileTitle, { color: th.ink }]}>{b.unlocked ? '🏆 ' : '🔒 '}{b.title}</Text>
                    <Text style={[st.tileSub, { color: th.mute }]}>{b.desc}</Text>
                  </View>
                ))}
              </View>

              {/* ١٨: ثيمات الألوان */}
              <Text style={[st.lab, { color: th.mute }]}>ثيمات الألوان (تفتح مع المستوى)</Text>
              <View style={st.wrap}>
                {THEMES.map((tm) => {
                  const unlocked = L >= tm.lvl;
                  const active = themeObj.id === tm.id;
                  return (
                    <Pressable
                      key={tm.id}
                      onPress={() => {
                        if (!unlocked) { Alert.alert('مقفول', `يفتح في مستوى ${tm.lvl}`); return; }
                        buzz('sel');
                        setExtra((prev) => ({ ...prev, themeId: tm.id }));
                      }}
                      style={[st.accTile, { backgroundColor: th.field, opacity: unlocked ? 1 : 0.5 }, active && { borderColor: th.ink, borderWidth: 2.5 }]}
                    >
                      <Text style={[st.tileTitle, { color: th.ink }]}>{tm.name}</Text>
                      <Text style={[st.tileSub, { color: unlocked ? '#0f9d6b' : th.mute }]}>{unlocked ? (active ? 'مفعّل' : 'اختيار') : `مستوى ${tm.lvl}`}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ١٩: إعدادات الاهتزاز */}
              <Pressable
                onPress={() => setExtra((prev) => ({ ...prev, hapticsOn: !prev.hapticsOn }))}
                style={[st.shareBtn, { backgroundColor: th.field, borderColor: th.mute, marginTop: 14 }]}
              >
                <Text style={{ color: th.ink, fontWeight: '800' }}>
                  الاهتزاز (Haptics): {extra.hapticsOn ? 'مفعّل ✅' : 'متوقف ❌'}
                </Text>
              </Pressable>

              <Pressable onPress={() => setStatsModal(false)} style={[st.go, { backgroundColor: th.ink }]}>
                <Text style={[st.goTxt, { color: th.bg }]}>إغلاق</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ١١، ١٣، ٢٠: مودال إضافة أو تعديل عادة */}
      <Modal visible={formModal} transparent animationType="slide" onRequestClose={() => setFormModal(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[st.h2, { color: th.ink }]}>{editingHabit ? 'تعديل العادة' : 'عادة جديدة'}</Text>
              <TextInput value={name} onChangeText={setName} placeholder="اسم العادة" placeholderTextColor={th.mute} maxLength={30}
                style={[st.input, { backgroundColor: th.field, color: th.ink }]} />

              <TextInput value={note} onChangeText={setNote} placeholder="ملاحظة سريعة (اختياري)" placeholderTextColor={th.mute} maxLength={60}
                style={[st.input, { backgroundColor: th.field, color: th.ink, marginTop: 10, fontSize: 15 }]} />

              <TextInput value={rem} onChangeText={setRem} placeholder="وقت التذكير مثلاً 08:00 ص (اختياري)" placeholderTextColor={th.mute} maxLength={20}
                style={[st.input, { backgroundColor: th.field, color: th.ink, marginTop: 10, fontSize: 15 }]} />

              <Text style={[st.lab, { color: th.mute }]}>اختار رمز (١٢ أيقونة)</Text>
              <View style={st.wrap}>
                {NAMES.map((n) => (
                  <Pressable key={n} onPress={() => { buzz('sel'); setIcon(n); }}
                    style={[st.ib, { backgroundColor: th.field }, icon === n && { borderColor: th.ink, borderWidth: 3 }]}>
                    <Icon name={n} size={32} />
                  </Pressable>
                ))}
              </View>

              <Text style={[st.lab, { color: th.mute }]}>كام مرة في اليوم؟</Text>
              <View style={[st.row, { justifyContent: 'center' }]}>
                <Pressable onPress={() => { buzz('sel'); setCnt(Math.max(1, cnt - 1)); }} style={[st.step, { backgroundColor: th.field }]}><Text style={[st.stepTxt, { color: th.ink }]}>−</Text></Pressable>
                <Text style={[st.cnt, { color: th.ink }]}>{cnt}</Text>
                <Pressable onPress={() => { buzz('sel'); setCnt(Math.min(20, cnt + 1)); }} style={[st.step, { backgroundColor: th.field }]}><Text style={[st.stepTxt, { color: th.ink }]}>+</Text></Pressable>
              </View>

              <Pressable onPress={saveHabit} style={[st.go, { backgroundColor: th.ink }]}>
                <Text style={[st.goTxt, { color: th.bg }]}>{editingHabit ? 'حفظ التعديل' : 'أضف العادة'}</Text>
              </Pressable>
              <Pressable onPress={() => setFormModal(false)} style={st.link}><Text style={{ color: th.mute, fontWeight: '700' }}>إلغاء</Text></Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ١٤ & ١٥: مودال استيراد ومقارنة واختيار من اللينك */}
      <Modal visible={impModal} transparent animationType="slide" onRequestClose={() => setImpModal(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card, maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[st.h2, { color: th.ink }]}>استيراد أو مقارنة من لينك</Text>

              {!importPreview ? (
                <>
                  <Text style={[st.lab, { color: th.mute }]}>الصق لينك المشاركة أو التحدي هنا:</Text>
                  <TextInput value={txt} onChangeText={setTxt} multiline placeholder="expohabits://share?d=..." placeholderTextColor={th.mute}
                    style={[st.input, { backgroundColor: th.field, color: th.ink, height: 110, textAlignVertical: 'top' }]} />
                  <Pressable onPress={parsePastedLink} style={[st.go, { backgroundColor: th.ink }]}>
                    <Text style={[st.goTxt, { color: th.bg }]}>عرض العادات</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {importPreview.meta?.challenge && (
                    <View style={{ backgroundColor: '#ffd54a', padding: 12, borderRadius: 16, marginVertical: 8 }}>
                      <Text style={{ color: INK, fontWeight: '800', textAlign: 'right' }}>
                        🔥 تحدي من صديق (مستوى {importPreview.meta.senderLvl} · أنجز {importPreview.meta.senderDone}/{importPreview.meta.senderAct} اليوم)
                      </Text>
                    </View>
                  )}
                  <Text style={[st.lab, { color: th.mute }]}>اختار العادات اللي تحب تضيفها عندك:</Text>
                  {importPreview.habits.map((item) => {
                    const checked = !!selectedImportIds[item.id];
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedImportIds((prev) => ({ ...prev, [item.id]: !checked }))}
                        style={[st.row, { justifyContent: 'space-between', backgroundColor: th.field, padding: 12, borderRadius: 14, marginBottom: 8 }]}
                      >
                        <Text style={{ color: th.ink, fontWeight: '800' }}>{item.name} ({item.t}x)</Text>
                        <Text style={{ fontSize: 18 }}>{checked ? '✅' : '⬜️'}</Text>
                      </Pressable>
                    );
                  })}
                  <Pressable onPress={confirmSelectedImport} style={[st.go, { backgroundColor: th.ink }]}>
                    <Text style={[st.goTxt, { color: th.bg }]}>إضافة المختار</Text>
                  </Pressable>
                </>
              )}

              <Pressable onPress={() => { setImpModal(false); setImportPreview(null); }} style={st.link}>
                <Text style={{ color: th.mute, fontWeight: '700' }}>إغلاق</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const sh = { shadowColor: '#1d1b3a', shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 4 };
const st = StyleSheet.create({
  flex: { flex: 1 },
  h1: { fontSize: 32, fontWeight: '800', textAlign: 'right', marginBottom: 12 },
  h2: { fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  subNote: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  lab: { fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  topPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, ...sh },
  topPillTxt: { fontSize: 13, fontWeight: '800' },
  hero: { borderRadius: 28, padding: 16, marginBottom: 14, ...sh },
  heroTxt: { fontSize: 17, fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  lvTxt: { fontSize: 13, fontWeight: '700', textAlign: 'right', marginTop: 10, marginBottom: 6 },
  petHint: { fontSize: 12, fontWeight: '700', color: '#ffd54a', textAlign: 'right', marginTop: 6 },
  bar: { height: 11, borderRadius: 11, backgroundColor: 'rgba(128,128,160,0.35)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 11 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  nextFocusBtn: { padding: 12, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 28, padding: 16, marginBottom: 16, ...sh },
  emo: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  nm: { fontSize: 19, fontWeight: '800', color: INK, textAlign: 'right' },
  meta: { fontSize: 14, color: INK, opacity: 0.78, textAlign: 'right' },
  noteTxt: { fontSize: 12, color: INK, opacity: 0.85, textAlign: 'right', marginTop: 2, fontWeight: '700' },
  miniBtn: { backgroundColor: 'rgba(255,255,255,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  miniBtnTxt: { fontSize: 12, fontWeight: '800', color: INK },
  big: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...sh },
  bigDown: { transform: [{ translateY: 4 }], shadowOffset: { width: 0, height: 1 } },
  bigTxt: { fontSize: 21, fontWeight: '800', color: INK },
  track: { height: 11, borderRadius: 11, backgroundColor: 'rgba(29,27,58,0.16)', marginVertical: 10, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: INK, borderRadius: 11 },
  wd: { flex: 1, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  wdTxt: { fontSize: 13, fontWeight: '700', color: INK },
  today: { borderWidth: 2, borderColor: INK },
  empty: { textAlign: 'center', fontSize: 17, padding: 26 },
  shareBtn: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, alignItems: 'center' },
  shareTxt: { fontSize: 15, fontWeight: '800' },
  link: { alignItems: 'center', padding: 12 },
  dev: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 4 },
  fab: { position: 'absolute', alignSelf: 'center', bottom: 26, height: 58, borderRadius: 29, paddingHorizontal: 28, backgroundColor: '#ffd54a', alignItems: 'center', justifyContent: 'center', ...sh },
  fabDown: { transform: [{ translateY: 4 }] },
  fabTxt: { fontSize: 19, fontWeight: '800', color: INK },
  back: { flex: 1, backgroundColor: 'rgba(20,18,50,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  input: { borderRadius: 16, padding: 14, fontSize: 17, textAlign: 'right' },
  ib: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  petTile: { width: '31%', borderRadius: 18, padding: 8, alignItems: 'center' },
  accTile: { width: '47%', borderRadius: 16, padding: 12, alignItems: 'center' },
  tileTitle: { fontSize: 13, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  tileSub: { fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  step: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 26, fontWeight: '800' },
  cnt: { fontSize: 28, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  go: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  goTxt: { fontSize: 19, fontWeight: '800' },
});
