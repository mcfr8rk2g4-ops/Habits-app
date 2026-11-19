import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, TextInput, Animated, Alert,
  StyleSheet, useColorScheme, SafeAreaView, Platform, StatusBar, Share, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Path, Rect, Circle, Ellipse, G } from 'react-native-svg';

const KEY = 'habits-rn-v1';
const PET_KEY = 'habits-rn-pets-v1';
const INK = '#1d1b3a';
const COL = ['#ff8a7a', '#ffd54a', '#5fe0b7', '#7cc4ff', '#b79cff', '#ff9ccf'];
const DN = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const GC = {
  B: ['#8fd3ff', '#1f6fe0'], R: ['#ff9a8a', '#d6282a'], G: ['#8ef0c0', '#0f9d6b'],
  P: ['#cdb8ff', '#6a3de0'], Y: ['#ffe985', '#f0a500'], K: ['#ffb3da', '#e0407f'],
  W: ['#ffffff', '#bfc6e6'],
};
const EMO = { '💧': 'drop', '🏃': 'run', '📖': 'book', '🧘': 'lotus', '🍎': 'apple', '😴': 'moon', '💊': 'pill', '⭐': 'star' };
const NAMES = ['drop', 'run', 'book', 'lotus', 'apple', 'moon', 'pill', 'star'];

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

const pad = (n) => (n < 10 ? '0' : '') + n;
const dk = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const back = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const uid = () => Math.random().toString(36).slice(2, 9);
const ok = (h, k) => (h.days[k] || 0) >= h.t;
const streak = (h) => {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    if (ok(h, dk(back(i)))) n++;
    else if (i > 0) break;
  }
  return n;
};
const lvl = (tot) => Math.floor(Math.sqrt(tot / 10)) + 1;

// تشفير وفك تشفير عربي آمن للرابط
function encodeHabitsPayload(habits) {
  const compact = habits.map((h) => ({
    n: h.name,
    e: h.e,
    c: h.c || 0,
    t: h.t || 1,
  }));
  const json = JSON.stringify({ v: 1, habits: compact });
  return encodeURIComponent(json);
}

function decodeHabitsPayload(rawInput) {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) throw new Error('empty');
  let encodedPart = trimmed;
  const match = trimmed.match(/[?&]d=([^&\s]+)/) || trimmed.match(/share\/([^?\s]+)/);
  if (match && match[1]) {
    encodedPart = match[1];
  }
  const decoded = decodeURIComponent(encodedPart);
  const parsed = JSON.parse(decoded);
  const list = Array.isArray(parsed) ? parsed : parsed.habits;
  if (!Array.isArray(list) || !list.length) throw new Error('invalid');
  return list.map((h) => ({
    id: uid(),
    name: String(h.n || h.name || '').slice(0, 30) || 'عادة',
    e: NAMES.includes(h.e) ? h.e : (EMO[h.e] || 'star'),
    c: typeof (h.c ?? h.color) === 'number' ? (h.c ?? h.color) : 0,
    t: Math.max(1, parseInt(h.t ?? h.target, 10) || 1),
    days: {},
  }));
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
    <Rect x="7" y="16" width="3" height="8" rx="1.5" fill="#fff" opacity="0.55" />
    <Rect x="35" y="16" width="3" height="8" rx="1.5" fill="#fff" opacity="0.55" />
  </>),
  book: () => (<>
    <Path d="M24 12C18 8 10 8 5 10v26c5-2 13-2 19 2Z" fill="url(#gP)" />
    <Path d="M24 12c6-4 14-4 19-2v26c-5-2-13-2-19 2Z" fill="url(#gW)" />
    <Path d="M24 12v26" stroke="#4a2bb0" strokeWidth="1.5" opacity="0.5" />
  </>),
  lotus: () => (<>
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" transform="rotate(-55 24 36)" />
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" transform="rotate(55 24 36)" />
    <Ellipse cx="24" cy="26" rx="7" ry="15" fill="url(#gG)" />
    <Ellipse cx="22" cy="20" rx="2" ry="6" fill="#fff" opacity="0.5" />
  </>),
  apple: () => (<>
    <Path d="M24 14c-4-4-18-2-18 14 0 9 7 16 12 16 3 0 4-1 6-1s3 1 6 1c5 0 12-7 12-16 0-16-14-18-18-14Z" fill="url(#gR)" />
    <Path d="M24 14c0-5 2-8 6-9" stroke="#6a3d1e" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Ellipse cx="34" cy="9" rx="6" ry="3" fill="url(#gG)" transform="rotate(-25 34 9)" />
    <Ellipse cx="14" cy="26" rx="3" ry="6" fill="#fff" opacity="0.5" transform="rotate(20 14 26)" />
  </>),
  moon: () => (<>
    <Path d="M31 6a19 19 0 1 0 12 28A15 15 0 0 1 31 6Z" fill="url(#gY)" />
    <Circle cx="17" cy="24" r="2.5" fill="#f0a500" opacity="0.5" />
    <Circle cx="24" cy="34" r="2" fill="#f0a500" opacity="0.5" />
  </>),
  pill: () => (
    <G transform="rotate(-45 24 24)">
      <Rect x="4" y="14" width="40" height="20" rx="10" fill="url(#gK)" />
      <Path d="M24 14h10a10 10 0 0 1 0 20H24Z" fill="url(#gW)" />
      <Rect x="9" y="17" width="26" height="4" rx="2" fill="#fff" opacity="0.5" />
    </G>
  ),
  star: () => (<>
    <Path d="M24 4l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 19l14-2Z" fill="url(#gY)" stroke="#f0a500" strokeWidth="1" strokeLinejoin="round" />
    <Path d="M24 11l3 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
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

// رسم الحيوان الأليف + الإكسسوارات والملابس
function PetAvatar({ petId, accessoryId, happy, size = 96 }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: -4, duration: 1100, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const pet = PETS.find((p) => p.id === petId) || PETS[0];
  const acc = WARDROBE.find((w) => w.id === accessoryId) || WARDROBE[0];
  const fillUrl = `url(#g${pet.body})`;
  const strokeMain = pet.body === 'W' ? '#8c94b8' : INK;

  return (
    <Animated.View style={{ transform: [{ translateY: bob }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Grads />
        <Ellipse cx="50" cy="93" rx="26" ry="4" fill="#000" opacity="0.2" />

        {/* الأذنين / القرون */}
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

        {/* جسم ورأس الحيوان */}
        <Ellipse cx="50" cy="58" rx="30" ry="28" fill={fillUrl} stroke={strokeMain} strokeWidth="2" />
        <Ellipse cx="40" cy="41" rx="8" ry="4.5" fill="#fff" opacity="0.4" />

        {/* بقع الباندا أو البطريق */}
        {pet.id === 'panda' && (<>
          <Circle cx="38" cy="54" r="7" fill={INK} />
          <Circle cx="62" cy="54" r="7" fill={INK} />
        </>)}

        {/* الخدود */}
        <Circle cx="31" cy="64" r="4.5" fill={pet.accent} opacity="0.7" />
        <Circle cx="69" cy="64" r="4.5" fill={pet.accent} opacity="0.7" />

        {/* العينين والفم */}
        {acc.id === 'glasses' ? (
          <G>
            <Rect x="31" y="48" width="15" height="11" rx="4" fill="#1d1b3a" stroke="#fff" strokeWidth="2" />
            <Rect x="54" y="48" width="15" height="11" rx="4" fill="#1d1b3a" stroke="#fff" strokeWidth="2" />
            <Path d="M46 53h8" stroke="#fff" strokeWidth="2.5" />
          </G>
        ) : (<>
          <Circle cx="39" cy="54" r="5" fill="#fff" />
          <Circle cx="61" cy="54" r="5" fill="#fff" />
          <Circle cx="40" cy="55" r="2.7" fill={INK} />
          <Circle cx="62" cy="55" r="2.7" fill={INK} />
        </>)}

        {happy
          ? <Path d="M42 66q8 11 16 0Z" fill={INK} />
          : <Path d="M43 67q7 5 14 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />}

        {/* إكسسوارات الرقبة / الملابس */}
        {acc.slot === 'neck' && (
          <G>
            <Rect x="28" y="80" width="44" height="9" rx="4.5" fill={acc.color} stroke={INK} strokeWidth="1.8" />
            {acc.id === 'bowtie' && (
              <Path d="M42 84L34 79v10l8-5zm16 0l8-5v10l-8-5z" fill="#ff9ccf" stroke={INK} strokeWidth="1.5" />
            )}
          </G>
        )}

        {/* إكسسوارات الرأس */}
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

function Card({ h, idx, today, onTap, onLong }) {
  const c = h.days[today] || 0;
  const fin = c >= h.t;
  const s = streak(h);
  return (
    <Pressable onLongPress={() => onLong(h)} style={[st.card, { backgroundColor: COL[(h.c || idx) % COL.length] }]}>
      <View style={st.row}>
        <View style={st.emo}><Icon name={h.e} size={44} /></View>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={st.nm}>{h.name}</Text>
          <Text style={st.meta}>
            {s ? `${s} يوم ورا بعض` : h.t > 1 ? `النهارده ${c} من ${h.t}` : 'ابدأ النهارده'}
          </Text>
        </View>
        <Pressable
          onPress={() => onTap(h)}
          style={({ pressed }) => [st.big, fin && { backgroundColor: INK }, pressed && st.bigDown]}
        >
          <Text style={[st.bigTxt, fin && { color: '#fff' }]}>{fin ? '✓' : h.t > 1 ? `${c}/${h.t}` : '+'}</Text>
        </Pressable>
      </View>
      <View style={st.track}><View style={[st.fill, { width: `${Math.min(c / h.t, 1) * 100}%` }]} /></View>
      <View style={st.row}>
        {[6, 5, 4, 3, 2, 1, 0].map((i) => {
          const d = back(i), k = dk(d), n = h.days[k] || 0;
          return (
            <View key={i} style={[st.wd, n >= h.t && { backgroundColor: INK }, n > 0 && n < h.t && { backgroundColor: 'rgba(255,255,255,0.95)' }, i === 0 && st.today]}>
              <Text style={[st.wdTxt, n >= h.t && { color: '#fff' }]}>{n >= h.t ? '✓' : DN[d.getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  const th = dark
    ? { bg: '#17152e', card: '#24214a', ink: '#eceaff', mute: '#a3a0cc', field: '#1a1838' }
    : { bg: '#eceaff', card: '#ffffff', ink: INK, mute: '#6d6a96', field: '#f1efff' };

  const [habits, setHabits] = useState([]);
  const [petState, setPetState] = useState({ activePet: 'cat', activeAcc: 'none', unlockedAcc: ['none'], spentPts: 0 });
  const [ready, setReady] = useState(false);

  const [add, setAdd] = useState(false);
  const [imp, setImp] = useState(false);
  const [petModal, setPetModal] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('drop');
  const [cnt, setCnt] = useState(1);
  const [txt, setTxt] = useState('');
  const today = dk(back(0));

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(PET_KEY)])
      .then(([rHabits, rPets]) => {
        if (rHabits) setHabits(JSON.parse(rHabits));
        if (rPets) setPetState((prev) => ({ ...prev, ...JSON.parse(rPets) }));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(habits)).catch(() => {});
  }, [habits, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(PET_KEY, JSON.stringify(petState)).catch(() => {});
  }, [petState, ready]);

  // استقبال رابط مشاركة عادات لو التطبيق اتفتح من لينك
  const applySharedHabits = (mapped) => {
    setHabits((hs) => [...hs, ...mapped]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('تمت إضافة العادات', `اتضافت ${mapped.length} عادة من اللينك بنجاح من غير ما تتأثر عاداتك القديمة.`);
  };

  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (!url || (!url.includes('d=') && !url.includes('share'))) return;
      try {
        const mapped = decodeHabitsPayload(url);
        Alert.alert('مشاركة عادات', `تم العثور على ${mapped.length} عادة في الرابط. تحب تضيفهم عندك؟`, [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إضافة العادات', onPress: () => applySharedHabits(mapped) },
        ]);
      } catch (_) {}
    };
    Linking.getInitialURL().then((u) => { if (u) handleUrl({ url: u }); }).catch(() => {});
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  const shareHabitsLink = async () => {
    if (!habits.length) {
      Alert.alert('مفيش عادات', 'أضف عادة واحدة على الأقل الأول عشان تقدر تشاركها بلينك.');
      return;
    }
    const payload = encodeHabitsPayload(habits);
    const link = `expohabits://share?d=${payload}`;
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `جرّب نفس العادات اللي شغال عليها في تطبيق عاداتي:\n${link}`,
        url: link,
      });
    } catch (_) {}
  };

  const tap = (h) => {
    const c = h.days[today] || 0;
    const days = { ...h.days };
    if (c >= h.t) {
      delete days[today];
      Haptics.selectionAsync();
    } else {
      days[today] = c + 1;
      if (c + 1 >= h.t) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, days } : x)));
  };

  const longPress = (h) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('حذف عادة', `تحذف "${h.name}"؟`, [
      { text: 'لأ', style: 'cancel' },
      { text: 'أيوه', style: 'destructive', onPress: () => setHabits((hs) => hs.filter((x) => x.id !== h.id)) },
    ]);
  };

  const save = () => {
    const n = name.trim();
    if (!n) return;
    setHabits((hs) => [...hs, { id: uid(), name: n.slice(0, 30), e: icon, c: hs.length % COL.length, t: cnt, days: {} }]);
    setName(''); setCnt(1); setAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const doImport = () => {
    try {
      const mapped = decodeHabitsPayload(txt);
      setImp(false);
      setTxt('');
      applySharedHabits(mapped);
    } catch (e) {
      Alert.alert('خطأ', 'اللينك أو النص ده غير صالح. تأكد إنك نسخت اللينك كامل.');
    }
  };

  let act = 0, done = 0, tot = 0;
  habits.forEach((h) => {
    act++; if (ok(h, today)) done++;
    Object.keys(h.days).forEach((k) => { tot += h.days[k]; });
  });
  const L = lvl(tot), cu = 10 * (L - 1) * (L - 1), nx = 10 * L * L;
  const totalPts = tot * 10;
  const availablePts = Math.max(0, totalPts - (petState.spentPts || 0));

  const currentPetObj = PETS.find((p) => p.id === petState.activePet) || PETS[0];
  const effectivePetId = L >= currentPetObj.unlockLvl ? currentPetObj.id : 'cat';

  const handleSelectPet = (pet) => {
    if (L < pet.unlockLvl) {
      Alert.alert('مقفول حالياً', `الحيوان "${pet.name}" بيفتح لما توصل لمستوى ${pet.unlockLvl}.`);
      return;
    }
    Haptics.selectionAsync();
    setPetState((prev) => ({ ...prev, activePet: pet.id }));
  };

  const handleAccessoryAction = (item) => {
    const alreadyUnlocked = petState.unlockedAcc.includes(item.id);
    if (alreadyUnlocked) {
      Haptics.selectionAsync();
      setPetState((prev) => ({ ...prev, activeAcc: item.id }));
      return;
    }
    if (availablePts < item.cost) {
      Alert.alert('نقاط غير كافية', `محتاج ${item.cost} نقطة متاحة لفتح "${item.name}" (معاك ${availablePts} نقطة).`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPetState((prev) => ({
      ...prev,
      spentPts: (prev.spentPts || 0) + item.cost,
      unlockedAcc: [...prev.unlockedAcc, item.id],
      activeAcc: item.id,
    }));
  };

  return (
    <SafeAreaView style={[st.flex, { backgroundColor: th.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={[st.h1, { color: th.ink }]}>عاداتي</Text>

        {/* بانر الحيوان الأليف والليفل */}
        <Pressable onPress={() => { Haptics.selectionAsync(); setPetModal(true); }} style={[st.hero, { backgroundColor: th.ink }]}>
          <View style={st.row}>
            <PetAvatar petId={effectivePetId} accessoryId={petState.activeAcc} happy={act > 0 && done === act} size={96} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[st.heroTxt, { color: th.bg }]}>
                {!act ? 'ابدأ بأول عادة' : done === act ? 'خلّصت كل حاجة النهارده!' : `خلّصت ${done} من ${act} النهارده`}
              </Text>
              <View style={st.bar}><View style={[st.barFill, { width: `${act ? (done / act) * 100 : 0}%`, backgroundColor: '#ffd54a' }]} /></View>
              <Text style={[st.lvTxt, { color: th.bg }]}>
                مستوى {L} · {availablePts} نقطة متاحة
              </Text>
              <View style={st.bar}><View style={[st.barFill, { width: `${Math.min(100, Math.max(0, ((tot - cu) / Math.max(1, nx - cu)) * 100))}%`, backgroundColor: '#5fe0b7' }]} /></View>
              <Text style={st.petHint}>🐾 الحيوانات والملابس (اضغط للتبديل)</Text>
            </View>
          </View>
        </Pressable>

        {habits.map((h, i) => (
          <Card key={h.id} h={h} idx={i} today={today} onTap={tap} onLong={longPress} />
        ))}
        {!habits.length && <Text style={[st.empty, { color: th.mute }]}>مفيش عادات لسه. دوس على الزرار الأصفر تحت.</Text>}

        {/* مشاركة واستيراد العادات بلينك */}
        <Pressable onPress={shareHabitsLink} style={[st.shareBtn, { backgroundColor: th.card, borderColor: th.ink }]}>
          <Text style={[st.shareTxt, { color: th.ink }]}>🔗 مشاركة عاداتي بلينك</Text>
        </Pressable>

        <Pressable onPress={() => setImp(true)} style={[st.link]}>
          <Text style={{ color: th.mute, fontWeight: '700' }}>استيراد عادات من لينك أو كود</Text>
        </Pressable>
        <Text style={[st.dev, { color: th.mute }]}>تطوير: محمد سامح</Text>
      </ScrollView>

      <Pressable onPress={() => { Haptics.selectionAsync(); setAdd(true); }} style={({ pressed }) => [st.fab, pressed && st.fabDown]}>
        <Text style={st.fabTxt}>＋ عادة جديدة</Text>
      </Pressable>

      {/* مودال الحيوانات العشرة والملابس */}
      <Modal visible={petModal} transparent animationType="slide" onRequestClose={() => setPetModal(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card, maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[st.h2, { color: th.ink }]}>الحيوانات الأليفة والملابس</Text>
              <Text style={[st.subNote, { color: th.mute }]}>مستواك الحالي: {L} · نقاطك المتاحة: {availablePts}</Text>

              <Text style={[st.lab, { color: th.mute }]}>اختار حيوانك (١٠ حيوانات مع الليفيل)</Text>
              <View style={st.wrap}>
                {PETS.map((p) => {
                  const unlocked = L >= p.unlockLvl;
                  const selected = effectivePetId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => handleSelectPet(p)}
                      style={[
                        st.petTile,
                        { backgroundColor: th.field, opacity: unlocked ? 1 : 0.55 },
                        selected && { borderColor: th.ink, borderWidth: 2.5 },
                      ]}
                    >
                      <PetAvatar petId={p.id} accessoryId={selected ? petState.activeAcc : 'none'} happy={unlocked} size={58} />
                      <Text style={[st.tileTitle, { color: th.ink }]} numberOfLines={1}>{p.name}</Text>
                      <Text style={[st.tileSub, { color: unlocked ? '#0f9d6b' : th.mute }]}>
                        {unlocked ? (selected ? 'مفعّل' : 'مفتوح') : `مستوى ${p.unlockLvl}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[st.lab, { color: th.mute }]}>إكسسوارات وملابس</Text>
              <View style={st.wrap}>
                {WARDROBE.map((item) => {
                  const unlocked = petState.unlockedAcc.includes(item.id);
                  const equipped = petState.activeAcc === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleAccessoryAction(item)}
                      style={[
                        st.accTile,
                        { backgroundColor: th.field },
                        equipped && { borderColor: th.ink, borderWidth: 2.5 },
                      ]}
                    >
                      <Text style={[st.tileTitle, { color: th.ink }]}>{item.name}</Text>
                      <Text style={[st.tileSub, { color: equipped ? '#1f6fe0' : th.mute }]}>
                        {equipped ? 'مرتديه ✓' : unlocked ? 'ارتداء' : `${item.cost} نقطة`}
                      </Text>
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

      {/* مودال إضافة عادة جديدة */}
      <Modal visible={add} transparent animationType="slide" onRequestClose={() => setAdd(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card }]}>
            <Text style={[st.h2, { color: th.ink }]}>عادة جديدة</Text>
            <TextInput value={name} onChangeText={setName} placeholder="اسم العادة" placeholderTextColor={th.mute} maxLength={30}
              style={[st.input, { backgroundColor: th.field, color: th.ink }]} />
            <Text style={[st.lab, { color: th.mute }]}>اختار رمز</Text>
            <View style={st.wrap}>
              {NAMES.map((n) => (
                <Pressable key={n} onPress={() => { Haptics.selectionAsync(); setIcon(n); }}
                  style={[st.ib, { backgroundColor: th.field }, icon === n && { borderColor: th.ink, borderWidth: 3 }]}>
                  <Icon name={n} size={34} />
                </Pressable>
              ))}
            </View>
            <Text style={[st.lab, { color: th.mute }]}>كام مرة في اليوم؟</Text>
            <View style={[st.row, { justifyContent: 'center' }]}>
              <Pressable onPress={() => { Haptics.selectionAsync(); setCnt(Math.max(1, cnt - 1)); }} style={[st.step, { backgroundColor: th.field }]}><Text style={[st.stepTxt, { color: th.ink }]}>−</Text></Pressable>
              <Text style={[st.cnt, { color: th.ink }]}>{cnt}</Text>
              <Pressable onPress={() => { Haptics.selectionAsync(); setCnt(Math.min(20, cnt + 1)); }} style={[st.step, { backgroundColor: th.field }]}><Text style={[st.stepTxt, { color: th.ink }]}>+</Text></Pressable>
            </View>
            <Pressable onPress={save} style={[st.go, { backgroundColor: th.ink }]}><Text style={[st.goTxt, { color: th.bg }]}>أضف العادة</Text></Pressable>
            <Pressable onPress={() => setAdd(false)} style={st.link}><Text style={{ color: th.mute, fontWeight: '700' }}>إلغاء</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* مودال استيراد العادات من لينك أو كود */}
      <Modal visible={imp} transparent animationType="slide" onRequestClose={() => setImp(false)}>
        <View style={st.back}>
          <View style={[st.sheet, { backgroundColor: th.card }]}>
            <Text style={[st.h2, { color: th.ink }]}>استيراد عادات من لينك</Text>
            <Text style={[st.lab, { color: th.mute }]}>الصق لينك المشاركة هنا عشان تضيف العادات عندك:</Text>
            <TextInput value={txt} onChangeText={setTxt} multiline placeholder="expohabits://share?d=..." placeholderTextColor={th.mute}
              style={[st.input, { backgroundColor: th.field, color: th.ink, height: 110, textAlignVertical: 'top' }]} />
            <Pressable onPress={doImport} style={[st.go, { backgroundColor: th.ink }]}><Text style={[st.goTxt, { color: th.bg }]}>إضافة العادات</Text></Pressable>
            <Pressable onPress={() => setImp(false)} style={st.link}><Text style={{ color: th.mute, fontWeight: '700' }}>إلغاء</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const sh = { shadowColor: '#1d1b3a', shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 4 };
const st = StyleSheet.create({
  flex: { flex: 1 },
  h1: { fontSize: 34, fontWeight: '800', textAlign: 'right', marginBottom: 12 },
  h2: { fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  subNote: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  lab: { fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  hero: { borderRadius: 28, padding: 16, marginBottom: 18, ...sh },
  heroTxt: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 8 },
  lvTxt: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: 10, marginBottom: 6 },
  petHint: { fontSize: 12, fontWeight: '700', color: '#ffd54a', textAlign: 'right', marginTop: 6 },
  bar: { height: 12, borderRadius: 12, backgroundColor: 'rgba(128,128,160,0.35)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 12 },
  card: { borderRadius: 28, padding: 16, marginBottom: 18, ...sh },
  emo: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  nm: { fontSize: 20, fontWeight: '800', color: INK, textAlign: 'right' },
  meta: { fontSize: 15, color: INK, opacity: 0.75, textAlign: 'right' },
  big: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...sh },
  bigDown: { transform: [{ translateY: 4 }], shadowOffset: { width: 0, height: 1 } },
  bigTxt: { fontSize: 22, fontWeight: '800', color: INK },
  track: { height: 12, borderRadius: 12, backgroundColor: 'rgba(29,27,58,0.16)', marginVertical: 12, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: INK, borderRadius: 12 },
  wd: { flex: 1, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  wdTxt: { fontSize: 13, fontWeight: '700', color: INK },
  today: { borderWidth: 2, borderColor: INK },
  empty: { textAlign: 'center', fontSize: 18, padding: 30 },
  shareBtn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 20, borderWidth: 2, alignItems: 'center' },
  shareTxt: { fontSize: 16, fontWeight: '800' },
  link: { alignItems: 'center', padding: 12 },
  dev: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 4 },
  fab: { position: 'absolute', alignSelf: 'center', bottom: 28, height: 60, borderRadius: 30, paddingHorizontal: 28, backgroundColor: '#ffd54a', alignItems: 'center', justifyContent: 'center', ...sh },
  fabDown: { transform: [{ translateY: 4 }] },
  fabTxt: { fontSize: 20, fontWeight: '800', color: INK },
  back: { flex: 1, backgroundColor: 'rgba(20,18,50,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  input: { borderRadius: 16, padding: 14, fontSize: 17, textAlign: 'right' },
  ib: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  petTile: { width: '31%', borderRadius: 18, padding: 8, alignItems: 'center' },
  accTile: { width: '47%', borderRadius: 16, padding: 12, alignItems: 'center' },
  tileTitle: { fontSize: 13, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  tileSub: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  step: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 26, fontWeight: '800' },
  cnt: { fontSize: 28, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  go: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  goTxt: { fontSize: 20, fontWeight: '800' },
});
