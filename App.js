import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Vibration, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUESTIONS = [
  { emoji: '📱', label: 'Text/Call Someone', win: 'Open their thread. Read last message. Don\'t reply yet. Win.' },
  { emoji: '💼', label: 'Work/Assignment', win: 'Open doc. Type 1 trash sentence. Save.' },
  { emoji: '🧹', label: 'Cleaning/Laundry', win: 'Pick up 3 things. Count out loud. Done.' },
  { emoji: '📱', label: 'Stuck on Phone', win: 'Put phone face down. Count to 10. Done.' },
  { emoji: '❓', label: "Don't Know", win: 'Stand up. Drink water. That\'s today\'s win.' }
];

export default function App() {
  const [screen, setScreen] = useState('loading'); // loading | onboarding | home | questions | panic | shredder | win
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [currentWin, setCurrentWin] = useState('');
  const [saves, setSaves] = useState(0);
  
  // Shredder state
  const [shredInput, setShredInput] = useState('');
  const [shredSteps, setShredSteps] = useState([]);
  const [shredLoading, setShredLoading] = useState(false);
  const [shredCount, setShredCount] = useState(0);

  // BUG #1 FIX: Check if user already did onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const done = await AsyncStorage.getItem('onboarding_done');
        const savedSaves = await AsyncStorage.getItem('saves');
        const savedShredCount = await AsyncStorage.getItem('shred_count');
        
        if (savedSaves) setSaves(parseInt(savedSaves));
        if (savedShredCount) setShredCount(parseInt(savedShredCount));
        
        if (done === 'true') {
          setScreen('home');
        } else {
          setScreen('onboarding');
        }
      } catch (e) {
        setScreen('onboarding');
      }
    };
    checkOnboarding();
  }, []);

  const handleSkipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_done', 'true');
      setScreen('home');
    } catch (e) {
      setScreen('home');
    }
  };

  const handlePanic = () => {
    Vibration.vibrate(50);
    setScreen('panic');
  };

  const handleWinComplete = async () => {
    const newSaves = saves + 1;
    setSaves(newSaves);
    await AsyncStorage.setItem('saves', newSaves.toString());
    Vibration.vibrate(100);
    setScreen('win');
  };

  const handleShred = async () => {
    if (!shredInput.trim()) return;
    setShredLoading(true);
    
    // Fake shred for MVP - breaks text into 3 steps
    setTimeout(async () => {
      const steps = [
        `Step 1: Open it. That's it.`,
        `Step 2: Do the smallest part. 30 seconds.`,
        `Step 3: Stop. You won.`
      ];
      setShredSteps(steps);
      const newCount = shredCount + 1;
      setShredCount(newCount);
      await AsyncStorage.setItem('shred_count', newCount.toString());
      setShredLoading(false);
    }, 800);
  };

  if (screen === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>unstuck</Text>
      </View>
    );
  }

  if (screen === 'onboarding') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Stop drowning.</Text>
        <Text style={styles.subtitle}>1 tap. 1 tiny win. Done.</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipOnboarding}>
          <Text style={styles.skipText}>Skip intro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.savesText}>Saves: {saves}</Text>
        
        <TouchableOpacity style={styles.panicButton} onPress={handlePanic}>
          <Text style={styles.panicText}>I'M STUCK</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('questions')}>
          <Text style={styles.secondaryText}>What kind of stuck?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('shredder')}>
          <Text style={styles.secondaryText}>Shred my brain dump</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'questions') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>What kind?</Text>
        {QUESTIONS.map((q, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.questionButton} 
            onPress={() => {
              setCurrentWin(q.win);
              setScreen('panic');
            }}
          >
            <Text style={styles.questionText}>{q.emoji} {q.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen('home')}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (screen === 'panic') {
    return (
      <View style={styles.container}>
        <Text style={styles.panicTitle}>STOP.</Text>
        <Text style={styles.winText}>{currentWin || 'Stand up. Drink water. That\'s today\'s win.'}</Text>
        
        <TouchableOpacity style={styles.doneButton} onPress={handleWinComplete}>
          <Text style={styles.buttonText}>DONE. I WIN.</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'shredder') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.shredderContainer}>
          <Text style={styles.title}>Brain dump</Text>
          <Text style={styles.subtitle}>Dump everything. We'll shred it to 3 steps.</Text>
          
          <TextInput
            style={styles.input}
            multiline
            placeholder="I'm overwhelmed by..."
            placeholderTextColor="#666"
            value={shredInput}
            onChangeText={setShredInput}
          />
          
          <TouchableOpacity style={styles.button} onPress={handleShred} disabled={shredLoading}>
            <Text style={styles.buttonText}>{shredLoading ? 'Shredding...' : 'SHRED IT'}</Text>
          </TouchableOpacity>

          {shredSteps.length > 0 && (
            <View style={styles.stepsContainer}>
              {shredSteps.map((step, i) => (
                <Text key={i} style={styles.stepText}>{step}</Text>
              ))}
              <TouchableOpacity style={styles.doneButton} onPress={handleWinComplete}>
                <Text style={styles.buttonText}>I DID STEP 1</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.backButton} onPress={() => {
            setShredInput('');
            setShredSteps([]);
            setScreen('home');
          }}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (screen === 'win') {
    return (
      <View style={styles.container}>
        <Text style={styles.winTitle}>WIN.</Text>
        <Text style={styles.subtitle}>You moved. That's enough.</Text>
        <Text style={styles.savesText}>Total saves: {saves}</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  panicTitle: {
    color: '#ff3b30',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 20,
  },
  winTitle: {
    color: '#34c759',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 20,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  winText: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 28,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
  },
  panicButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginVertical: 20,
    width: '100%',
  },
  doneButton: {
    backgroundColor: '#34c759',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
  },
  secondaryButton: {
    borderColor: '#333',
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
  },
  questionButton: {
    borderColor: '#333',
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
  },
  backButton: {
    marginTop: 30,
    padding: 10,
  },
  skipButton: {
    marginTop: 20,
    padding: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  panicText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  questionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'left',
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
  savesText: {
    color: '#666',
    fontSize: 14,
    position: 'absolute',
    top: 60,
    right: 20,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  shredderContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stepsContainer: {
    marginTop: 30,
    width: '100%',
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#1c1c1e',
    padding: 12,
    borderRadius: 8,
  },
});
