// app/(tabs)/math.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

type Difficulty = { label: string; seconds: number };
const DIFFICULTIES: Difficulty[] = [
  { label: 'Kolay (10s)', seconds: 10 },
  { label: 'Orta  (7s)',  seconds: 7  },
  { label: 'Zor   (5s)',   seconds: 5  },
];

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = (width - 64) / 3; // 3 buton + padding

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export default function MathGameScreen() {
  const [showDiffModal, setShowDiffModal] = useState(true);
  const [duration, setDuration]       = useState(7);
  const [gameActive, setGameActive]   = useState(false);

  const [question, setQuestion]       = useState('');
  const [correct, setCorrect]         = useState(0);
  const [options, setOptions]         = useState<number[]>([]);
  const [score, setScore]             = useState(0);
  const [highScore, setHighScore]     = useState(0);
  const [timeLeft, setTimeLeft]       = useState(0);

  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem('@math_high_score').then(val => {
      if (val) setHighScore(parseInt(val, 10));
    });
  }, []);

  useEffect(() => {
    if (!gameActive) return;
    if (timeLeft <= 0) {
      onGameOver();
      return;
    }
    Animated.timing(anim, {
      toValue: timeLeft / duration,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameActive]);

  const generateQuestion = () => {
    const a = getRandomInt(1, 20);
    const b = getRandomInt(1, 20);
    const add = Math.random() > 0.5;
    const res = add ? a + b : a - b;

    setQuestion(`${a} ${add ? '+' : '-'} ${b}`);
    setCorrect(res);

    const s = new Set<number>([res]);
    while (s.size < 3) {
      s.add(getRandomInt(res - 10, res + 10));
    }
    setOptions(Array.from(s).sort(() => Math.random() - 0.5));

    setTimeLeft(duration);
    anim.setValue(1);
  };

  const onGameOver = () => {
    setGameActive(false);
    if (score > highScore) {
      setHighScore(score);
      AsyncStorage.setItem('@math_high_score', score.toString());
      Alert.alert('🎉 Yeni Rekor!', `Tebrikler! Skorun: ${score}`);
    } else {
      Alert.alert('⏰ Oyun Bitti', `Skorun: ${score}`);
    }
  };

  const handleAnswer = (n: number) => {
    if (!gameActive) return;
    if (n === correct) {
      setScore(s => s + 1);
      generateQuestion();
    } else {
      onGameOver();
    }
  };

  const resetGame = () => {
    setScore(0);
    generateQuestion();
    setGameActive(true);
  };

  const pickDifficulty = (d: Difficulty) => {
    setDuration(d.seconds);
    setShowDiffModal(false);
    setScore(0);
    generateQuestion();
    setGameActive(true);
  };

  return (
    <LinearGradient colors={['#2a2a2e', '#141417']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Zorluk Seçim Modalı */}
        <Modal transparent visible={showDiffModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Zorluk Seviyesi Seç</Text>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity
                  key={d.seconds}
                  style={styles.modalBtn}
                  onPress={() => pickDifficulty(d)}
                >
                  <Text style={styles.modalBtnText}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Oyun Alanı */}
        {!showDiffModal && (
          <>
            <View style={styles.topBar}>
              <Text style={styles.scoreLabel}>Skor</Text>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreLabel}>Rekor</Text>
              <Text style={styles.scoreValue}>{highScore}</Text>
            </View>

            {/* Zaman Çubuğu */}
            <View style={styles.barBg}>
              <Animated.View style={[styles.barFg, { flex: anim }]} />
            </View>
            <Text style={styles.timerText}>⏱ {timeLeft}s</Text>

            {/* Soru */}
            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{question}</Text>
            </View>

            {/* Seçenekler */}
            <View style={styles.optionsRow}>
              {options.map((o, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.optionBtn}
                  onPress={() => handleAnswer(o)}
                >
                  <Text style={styles.optionText}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Yeniden Oyna */}
            {!gameActive && (
              <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
                <Text style={styles.resetText}>Yeniden Başlat</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  barBg: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFg: {
    backgroundColor: '#4cd137',
  },
  timerText: {
    color: '#f1c40f',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  questionBox: {
    backgroundColor: '#1e1e20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  questionText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionBtn: {
    width: BUTTON_WIDTH,
    backgroundColor: '#273c75',
    paddingVertical: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  optionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: '#e84118',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  resetText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2f3640',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '700',
  },
  modalBtn: {
    width: '100%',
    backgroundColor: '#487eb0',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
