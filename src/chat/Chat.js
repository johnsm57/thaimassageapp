import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'What time you want to book your massage?',
      time: '8:30 am',
      isSent: false,
      seen: true,
    },
    {
      id: '2',
      text: "Let's go for 3:30 pm",
      time: '8:35 am',
      isSent: true,
      seen: true,
    },
    {
      id: '3',
      text: 'Ohk no problem. See you in the salon.',
      time: '8:42 am',
      isSent: false,
      seen: true,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        isSent: true,
        seen: false,
      };

      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        
        const newMessage = {
          id: Date.now().toString(),
          image: imageUri,
          time: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          isSent: true,
          seen: false,
        };

        setMessages([...messages, newMessage]);
      }
    });
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isSent ? styles.sentContainer : styles.receivedContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isSent ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.messageImage} />
        ) : (
          <Text style={[styles.messageText, item.isSent && styles.sentText]}>
            {item.text}
          </Text>
        )}
      </View>
      <View style={[styles.messageInfo, item.isSent && styles.sentInfo]}>
        {item.isSent && item.seen && (
          <Text style={styles.seenText}>Seen</Text>
        )}
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  const renderDateSeparator = () => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateText}>Today</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8C4D4" />
      
      {/* Header */}
      <LinearGradient
        colors={['#DEAAB2', '#FFDDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Zen Thai Studio</Text>
          <Text style={styles.headerSubtitle}>Active now 🟢</Text>
        </View>
      </LinearGradient>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderDateSeparator}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleImagePicker}
          >
            <View style={styles.galleryIcon}>
              <View style={styles.iconSquare} />
              <View style={[styles.iconSquare, styles.iconSquareSmall]} />
            </View>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Enter your message..."
            placeholderTextColor="#9B868E"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE2E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingTop: Platform.OS === 'ios' ? 44 : 72,
    height: 129,
    width: '100%',
    shadowColor: '#D7B5BA',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingBottom: 10,
  },
  backIcon: {
    fontSize: 28,
    color: '#6B4C5C',
    fontWeight: '300',
  },
  headerTextContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A2C3A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B4C5C',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#8B7B7B',
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '85%',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  receivedBubble: {
    backgroundColor: '#FFF6EF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 56,
    shadowColor: '#8C8C8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sentBubble: {
    backgroundColor: '#D96073',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 56,
    borderBottomLeftRadius: 10,
    shadowColor: '#8C8C8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#262628',
    lineHeight: 20,
  },
  sentText: {
    color: '#4A2C3A',
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sentInfo: {
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#9B8B8B',
    marginLeft: 8,
  },
  seenText: {
    fontSize: 11,
    color: '#9B8B8B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#EDCFC9',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
  },
  galleryButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  galleryIcon: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  iconSquare: {
    width: 16,
    height: 16,
    borderWidth: 2.5,
    borderColor: '#A67186',
    borderRadius: 4,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  iconSquareSmall: {
    width: 11,
    height: 11,
    top: 9,
    left: 9,
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#A67186',
    borderRadius: 3,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 15,
    color: '#5A4048',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 22,
    color: '#A67186',
    fontWeight: 'bold',
  },
});

export default ChatScreen;