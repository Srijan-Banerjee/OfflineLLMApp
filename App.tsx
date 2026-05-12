import React, {useState, useCallback, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {initLlama} from 'llama.rn';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const App = () => {
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const pickModel = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles], // Ideally filter for .gguf if possible
      });
      
      const path = res[0].uri;
      if (path.toLowerCase().endsWith('.gguf')) {
        setModelPath(path);
        loadModel(path);
      } else {
        Alert.alert('Invalid File', 'Please select a .gguf model file.');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error(err);
      }
    }
  };

  const loadModel = async (path: string) => {
    setLoading(true);
    try {
      if (context) {
        await context.release();
      }
      const newContext = await initLlama({
        model: path,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 0, // Most mobile chips use CPU for llama.cpp unless specific drivers are available
      });
      setContext(newContext);
      setMessages([{id: '1', text: 'Model loaded! How can I help you today?', sender: 'ai'}]);
    } catch (err) {
      Alert.alert('Error', 'Failed to load model: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !context || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {id: aiMessageId, text: '', sender: 'ai'}]);

    try {
      let fullResponse = '';
      await context.completion(
        {
          prompt: inputText,
          n_predict: 512,
          stop: ['</s>', 'Llama:', 'User:'],
        },
        (token: string) => {
          fullResponse += token;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId ? {...msg, text: fullResponse} : msg,
            ),
          );
        },
      );
    } catch (err) {
      Alert.alert('Error', 'Inference failed: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline LLM Chat</Text>
        <TouchableOpacity style={styles.modelButton} onPress={pickModel}>
          <Text style={styles.modelButtonText}>
            {modelPath ? 'Change Model' : 'Load GGUF'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading model... This may take a minute.</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}>
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}>
              <Text
                style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userText : styles.aiText,
                ]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {isGenerating && (
            <ActivityIndicator style={{alignSelf: 'flex-start', marginLeft: 20}} />
          )}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={context ? "Type a message..." : "Load a model first"}
          value={inputText}
          onChangeText={setInputText}
          editable={!!context && !isGenerating}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!context || isGenerating) && styles.disabledButton]}
          onPress={sendMessage}
          disabled={!context || isGenerating}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modelButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modelButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  chatArea: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#FFF',
  },
  aiText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#B0C4DE',
  },
});

export default App;
